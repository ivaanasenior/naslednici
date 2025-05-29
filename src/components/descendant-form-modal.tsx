
"use client";

import { useEffect } from 'react'; // Import useEffect
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import type { Heir, Relationship } from '@/types/heir'; // Keep Relationship for potential future use, though not set here

const descendantFormSchema = z.object({
  name: z.string().min(1, { message: 'Ime nasljednika je obavezno.' }),
  // Relationship is implicitly 'descendant'/'grandchild' etc., determined by nesting.
  // We could add it if needed for display, but it's not crucial for calculation logic here.
  relationship: z.literal('CHILD').default('CHILD'), // Set default as CHILD (of the deceased parent)
  isAlive: z.boolean().default(true),
  acceptsInheritance: z.boolean().default(true),
}).refine(data => data.isAlive || !data.acceptsInheritance, {
    message: "Preminuli nasljednik ne može prihvatiti nasljedstvo.",
    path: ["acceptsInheritance"],
});


type DescendantFormValues = z.infer<typeof descendantFormSchema>;

interface DescendantFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddDescendant: (descendantData: Omit<Heir, 'id' | 'descendants'>) => void;
    parentName: string;
}

export function DescendantFormModal({ isOpen, onClose, onAddDescendant, parentName }: DescendantFormModalProps) {
  const form = useForm<DescendantFormValues>({
    resolver: zodResolver(descendantFormSchema),
    defaultValues: {
      name: '',
      relationship: 'CHILD', // Default child relationship to the parent heir
      isAlive: true,
      acceptsInheritance: true,
    },
  });

  const isAliveValue = form.watch('isAlive');

  useEffect(() => { // Use useEffect directly
    if (!isAliveValue) {
      form.setValue('acceptsInheritance', false);
    }
  }, [isAliveValue, form]);

  // Reset form when modal opens or closes
  useEffect(() => { // Use useEffect directly
    if (!isOpen) {
        form.reset();
    }
  }, [isOpen, form]);


  function onSubmit(values: DescendantFormValues) {
    // Relationship is implicitly determined by nesting, but we pass it along
    const descendantData: Omit<Heir, 'id' | 'descendants'> = {
      name: values.name,
      relationship: values.relationship, // Pass it as CHILD (of the parent)
      isAlive: values.isAlive,
      acceptsInheritance: values.isAlive ? values.acceptsInheritance : false,
    };
    onAddDescendant(descendantData);
    form.reset(); // Reset after successful submission inside the modal
    // onClose(); // The parent component calls onClose after handleAddDescendant
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Dodaj Nasljednika za {parentName}</DialogTitle>
          <DialogDescription>
            Unesite podatke o djetetu preminulog nasljednika ({parentName}). Oni će naslijediti njegov dio.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ime Nasljednika (Potomka)</FormLabel>
                  <FormControl>
                    <Input placeholder="Npr. Petar Petrović" {...field} aria-required="true" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             {/* Relationship is implicitly CHILD of the parent */}

            <FormField
                control={form.control}
                name="isAlive"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-secondary/90">
                    <div className="space-y-0.5">
                        <FormLabel>Da li je živ?</FormLabel>
                        <FormDescription>
                            Status potomka.
                        </FormDescription>
                    </div>
                    <FormControl>
                        <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        aria-label="Da li je potomak živ"
                        />
                    </FormControl>
                    </FormItem>
                )}
            />

             <FormField
                control={form.control}
                name="acceptsInheritance"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-secondary/90">
                    <div className="space-y-0.5">
                        <FormLabel>Da li se prihvata nasljedstva?</FormLabel>
                        <FormDescription>
                            Da li potomak prihvata dio nasljedstva.
                        </FormDescription>
                    </div>
                    <FormControl>
                        <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={!isAliveValue} // Disable if not alive
                        aria-label="Da li se potomak prihvata nasljedstva"
                        />
                    </FormControl>
                    </FormItem>
                )}
             />

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="ghost">Odustani</Button>
              </DialogClose>
              <Button type="submit">Sačuvaj Potomka</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
