import { Check, ChevronsUpDown } from 'lucide-react';
import { memo, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface ComboboxProps {
    options: string[];
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
}

export const Combobox = memo(function Combobox({ options, value, onChange, placeholder }: ComboboxProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedValue, setSelectedValue] = useState(value);

    useEffect(() => {
        setSelectedValue(value);
    }, [value]);

    const filteredOptions = options.filter((option) => option.toLowerCase().includes(search.toLowerCase()));

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="mt-1.5 w-full justify-between"
                >
                    {selectedValue || placeholder}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
                <Command>
                    <CommandInput placeholder={`Search or type new...`} value={search} onValueChange={setSearch} />
                    <CommandList>
                        <CommandEmpty>
                            <Button
                                variant="ghost"
                                className="w-full"
                                onClick={() => {
                                    if (search) {
                                        setSelectedValue(search);
                                        onChange(search);
                                        setOpen(false);
                                        setSearch('');
                                    }
                                }}
                            >
                                Create "{search}"
                            </Button>
                        </CommandEmpty>
                        <CommandGroup>
                            {filteredOptions.map((option) => (
                                <CommandItem
                                    key={option}
                                    value={option}
                                    onSelect={(currentValue) => {
                                        setSelectedValue(currentValue);
                                        onChange(currentValue);
                                        setOpen(false);
                                        setSearch('');
                                    }}
                                >
                                    <Check
                                        className={`mr-2 h-4 w-4 ${selectedValue === option ? 'opacity-100' : 'opacity-0'}`}
                                    />
                                    {option}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
});
