"use client";

import * as React from "react";
import { Search } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/* ------------------------------------------------------------------ */
/* Context                                                             */
/* ------------------------------------------------------------------ */

type CommandContextValue = {
  search: string;
  setSearch: (value: string) => void;
  shouldFilter: boolean;
  filter: (value: string, search: string) => boolean;
};

const CommandContext = React.createContext<CommandContextValue | null>(null);

function useCommandContext() {
  const ctx = React.useContext(CommandContext);
  if (!ctx) throw new Error("Command components must be used within <Command>");
  return ctx;
}

function defaultFilter(value: string, search: string): boolean {
  const normalized = value.trim().toLowerCase();
  const parts = search.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return parts.every((part) => normalized.includes(part));
}

/* ------------------------------------------------------------------ */
/* Command                                                             */
/* ------------------------------------------------------------------ */

interface CommandProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string;
  onValueChange?: (value: string) => void;
  filter?: (value: string, search: string) => boolean;
  shouldFilter?: boolean;
  loop?: boolean;
}

const Command = React.forwardRef<HTMLDivElement, CommandProps>(
  (
    {
      className,
      children,
      value: valueProp,
      onValueChange,
      filter,
      shouldFilter = true,
      loop = true,
      onKeyDown,
      ...props
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = React.useState("");
    const value = valueProp ?? internalValue;
    const setValue = (next: string) => {
      setInternalValue(next);
      onValueChange?.(next);
    };
    const filterFn = filter ?? defaultFilter;
    const listRef = React.useRef<HTMLDivElement>(null);

    const setRootRef = React.useCallback(
      (node: HTMLDivElement | null) => {
        listRef.current = node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      },
      [ref]
    );

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      const list = listRef.current;
      if (list) {
        const items = Array.from(
          list.querySelectorAll<HTMLElement>("[data-command-item]")
        );
        if (items.length > 0) {
          const currentIndex = items.indexOf(document.activeElement as HTMLElement);

          switch (event.key) {
            case "ArrowDown": {
              event.preventDefault();
              const index =
                currentIndex === -1 ? 0 : loop ? (currentIndex + 1) % items.length : Math.min(currentIndex + 1, items.length - 1);
              items[index]?.focus();
              break;
            }
            case "ArrowUp": {
              event.preventDefault();
              const index =
                currentIndex === -1
                  ? items.length - 1
                  : loop
                    ? (currentIndex - 1 + items.length) % items.length
                    : Math.max(currentIndex - 1, 0);
              items[index]?.focus();
              break;
            }
            case "Enter": {
              const active = document.activeElement as HTMLElement | null;
              if (active && active.hasAttribute("data-command-item")) {
                event.preventDefault();
                active.click();
              }
              break;
            }
            case "Escape": {
              if (value) {
                event.preventDefault();
                setValue("");
              }
              break;
            }
          }
        }
      }
      onKeyDown?.(event);
    };

    return (
      <CommandContext.Provider
        value={{ search: value, setSearch: setValue, shouldFilter, filter: filterFn }}
      >
        <div
          ref={setRootRef}
          className={cn(
            "flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground",
            className
          )}
          onKeyDown={handleKeyDown}
          {...props}
        >
          {children}
        </div>
      </CommandContext.Provider>
    );
  }
);
Command.displayName = "Command";

/* ------------------------------------------------------------------ */
/* CommandInput                                                         */
/* ------------------------------------------------------------------ */

interface CommandInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  placeholder?: string;
}

const CommandInput = React.forwardRef<HTMLInputElement, CommandInputProps>(
  ({ className, placeholder = "Search…", ...props }, ref) => {
    const { search, setSearch } = useCommandContext();
    return (
      <div className="flex items-center border-b px-3">
        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
        <input
          ref={ref}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={placeholder}
          className={cn(
            "flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);
CommandInput.displayName = "CommandInput";

/* ------------------------------------------------------------------ */
/* CommandList                                                          */
/* ------------------------------------------------------------------ */

const CommandList = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className)}
      {...props}
    />
  )
);
CommandList.displayName = "CommandList";

/* ------------------------------------------------------------------ */
/* CommandEmpty                                                         */
/* ------------------------------------------------------------------ */

const CommandEmpty = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("py-6 text-center text-sm text-muted-foreground", className)}
      {...props}
    />
  )
);
CommandEmpty.displayName = "CommandEmpty";

/* ------------------------------------------------------------------ */
/* CommandGroup                                                         */
/* ------------------------------------------------------------------ */

interface CommandGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  heading?: string;
}

const CommandGroup = React.forwardRef<HTMLDivElement, CommandGroupProps>(
  ({ className, heading, children, ...props }, ref) => (
    <div ref={ref} className={cn("overflow-hidden p-1 text-foreground", className)} {...props}>
      {heading && (
        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">{heading}</div>
      )}
      {children}
    </div>
  )
);
CommandGroup.displayName = "CommandGroup";

/* ------------------------------------------------------------------ */
/* CommandItem                                                          */
/* ------------------------------------------------------------------ */

interface CommandItemProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onSelect"> {
  value?: string;
  keywords?: string[];
  onSelect?: (value: string) => void;
}

const CommandItem = React.forwardRef<HTMLButtonElement, CommandItemProps>(
  ({ className, children, value = "", keywords, onSelect, disabled, ...props }, ref) => {
    const { search, shouldFilter, filter } = useCommandContext();
    const haystack = `${value} ${keywords?.join(" ") ?? ""}`.trim();
    const visible = !shouldFilter || !search || filter(haystack, search);
    if (!visible) return null;

    return (
      <button
        ref={ref}
        type="button"
        data-command-item
        disabled={disabled}
        onClick={() => onSelect?.(value)}
        className={cn(
          "relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
CommandItem.displayName = "CommandItem";

/* ------------------------------------------------------------------ */
/* CommandSeparator                                                     */
/* ------------------------------------------------------------------ */

const CommandSeparator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("-mx-1 h-px bg-border", className)} {...props} />
  )
);
CommandSeparator.displayName = "CommandSeparator";

/* ------------------------------------------------------------------ */
/* CommandShortcut                                                      */
/* ------------------------------------------------------------------ */

const CommandShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn("ml-auto text-xs tracking-widest text-muted-foreground", className)}
      {...props}
    />
  );
};
CommandShortcut.displayName = "CommandShortcut";

/* ------------------------------------------------------------------ */
/* CommandDialog                                                         */
/* ------------------------------------------------------------------ */

interface CommandDialogProps extends React.ComponentPropsWithoutRef<typeof Dialog> {
  title?: string;
  commandProps?: CommandProps;
}

const CommandDialog = ({ children, title = "Command", commandProps, ...props }: CommandDialogProps) => {
  return (
    <Dialog {...props}>
      <DialogContent className="overflow-hidden p-0 shadow-lifted max-w-md">
        <DialogHeader className="sr-only">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <Command {...commandProps}>{children}</Command>
      </DialogContent>
    </Dialog>
  );
};
CommandDialog.displayName = "CommandDialog";

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
};
