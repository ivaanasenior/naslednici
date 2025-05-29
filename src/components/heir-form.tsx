
"use client";

import type React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Trash2, User, Heart, Users, Parentheses, PersonStanding, CheckCircle, XCircle, HelpCircle, Info, PlusCircle, CornerDownRight, Scaling, UserSquare2 } from 'lucide-react';
import type { Heir, Relationship } from '@/types/heir';
import { DescendantFormModal } from './descendant-form-modal';
import { addDescendantToHeir } from '@/lib/heir-utils';

const formSchema = z.object({
  name: z.string().min(1, { message: 'Ime nasljednika je obavezno.' }),
  relationship: z.enum([
    'SPOUSE',
    'CHILD',
    'PARENT',
    'PATERNAL_GRANDFATHER',
    'PATERNAL_GRANDMOTHER',
    'MATERNAL_GRANDFATHER',
    'MATERNAL_GRANDMOTHER',
    'PGF_F', 'PGF_M', 'PGM_F', 'PGM_M', 
    'MGF_F', 'MGF_M', 'MGM_F', 'MGM_M', 
  ], { required_error: 'Odnos prema ostaviocu je obavezan.' }),
  isAlive: z.boolean().default(true),
  acceptsInheritance: z.boolean().default(true),
  requestSeparateHalf: z.boolean().optional().default(false),
}).refine(data => data.isAlive || !data.acceptsInheritance, {
    message: "Preminuli nasljednik ne može prihvatiti nasljedstvo.",
    path: ["acceptsInheritance"],
}).refine(data => data.relationship !== 'SPOUSE' || !data.requestSeparateHalf || (data.isAlive && data.acceptsInheritance), {
    message: "Supružnik može tražiti izdvajanje polovine samo ako je živ i prihvata nasljedstvo.",
    path: ["requestSeparateHalf"],
});


type HeirFormValues = z.infer<typeof formSchema>;

interface HeirFormProps {
  onAddHeir: (heir: Heir) => void;
  heirs: Heir[];
  onRemoveHeir: (id: string) => void;
  deceasedName: string;
  setDeceasedName: (name: string) => void;
  setHeirs: React.Dispatch<React.SetStateAction<Heir[]>>;
}

const relationshipLabels: Record<Relationship, string> = {
  SPOUSE: 'Supružnik',
  CHILD: 'Dijete',
  PARENT: 'Roditelj',
  PATERNAL_GRANDFATHER: 'Djed (očeva strana)',
  PATERNAL_GRANDMOTHER: 'Baba (očeva strana)',
  MATERNAL_GRANDFATHER: 'Djed (majcina strana)',
  MATERNAL_GRANDMOTHER: 'Baba (majcina strana)',
  PGF_F: 'Pradjed (otac očevog oca)',
  PGF_M: 'Prababa (majka očevog oca)',
  PGM_F: 'Pradjed (otac očeve majke)',
  PGM_M: 'Prababa (majka očeve majke)',
  MGF_F: 'Pradjed (otac majčinog oca)',
  MGF_M: 'Prababa (majka majčinog oca)',
  MGM_F: 'Pradjed (otac majčine majke)',
  MGM_M: 'Prababa (majka majčine majke)',
};

const relationshipIcons: Record<Relationship, React.ElementType> = {
    SPOUSE: Heart,
    CHILD: PersonStanding,
    PARENT: Parentheses,
    PATERNAL_GRANDFATHER: UserSquare2,
    PATERNAL_GRANDMOTHER: UserSquare2,
    MATERNAL_GRANDFATHER: UserSquare2,
    MATERNAL_GRANDMOTHER: UserSquare2,
    PGF_F: UserSquare2, PGF_M: UserSquare2, PGM_F: UserSquare2, PGM_M: UserSquare2,
    MGF_F: UserSquare2, MGF_M: UserSquare2, MGM_F: UserSquare2, MGM_M: UserSquare2,
};

const RelationshipIcon = ({ relationship }: { relationship: Relationship }) => {
    const IconComponent = relationshipIcons[relationship] || User;
    return <IconComponent className="mr-2 h-4 w-4 text-muted-foreground" />;
};

const StatusIcon = ({ isAlive, acceptsInheritance, requestSeparateHalf }: { isAlive: boolean, acceptsInheritance: boolean, requestSeparateHalf?: boolean }) => {
    const icons = [];

    if (!isAlive) {
      icons.push(
        <TooltipProvider key="deceased">
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="ml-2 h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Preminuo/la</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    } else {
        if (acceptsInheritance) {
            icons.push(
                <TooltipProvider key="accepts">
                <Tooltip>
                    <TooltipTrigger asChild>
                    <CheckCircle className="ml-2 h-4 w-4 text-green-600 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                    <p>Prihvata nasljedstvo</p>
                    </TooltipContent>
                </Tooltip>
                </TooltipProvider>
            );
            if (requestSeparateHalf) {
                 icons.push(
                    <TooltipProvider key="separateHalf">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Scaling className="ml-1 h-4 w-4 text-blue-600 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Traži izdvajanje polovine</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                 );
            }
        } else {
             icons.push(
                 <TooltipProvider key="rejects">
                    <Tooltip>
                    <TooltipTrigger asChild>
                        <XCircle className="ml-2 h-4 w-4 text-destructive cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Ne prihvata nasljedstvo</p>
                    </TooltipContent>
                    </Tooltip>
                 </TooltipProvider>
             );
        }
    }

    return <>{icons}</>;
};


export function HeirForm({ onAddHeir, heirs, onRemoveHeir, deceasedName, setDeceasedName, setHeirs }: HeirFormProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [isAddingDescendant, setIsAddingDescendant] = useState(false);
  const [parentHeirForDescendant, setParentHeirForDescendant] = useState<Heir | null>(null);

  const form = useForm<HeirFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      relationship: undefined,
      isAlive: true,
      acceptsInheritance: true,
      requestSeparateHalf: false,
    },
  });

  const isAliveValue = form.watch('isAlive');
  const relationshipValue = form.watch('relationship');
  const acceptsInheritanceValue = form.watch('acceptsInheritance');

  useEffect(() => {
    if (!isAliveValue) {
      form.setValue('acceptsInheritance', false);
      form.setValue('requestSeparateHalf', false);
    }
    if (relationshipValue !== 'SPOUSE') {
        form.setValue('requestSeparateHalf', false);
    }
    if (relationshipValue === 'SPOUSE' && !acceptsInheritanceValue) {
        form.setValue('requestSeparateHalf', false);
    }
  }, [isAliveValue, relationshipValue, acceptsInheritanceValue, form]);


  function onSubmit(values: HeirFormValues) {
    const finalValues: Heir = {
        ...values,
        acceptsInheritance: values.isAlive ? values.acceptsInheritance : false,
        requestSeparateHalf: (values.relationship === 'SPOUSE' && values.isAlive && values.acceptsInheritance) ? values.requestSeparateHalf : false,
        id: Date.now().toString(),
        descendants: [],
    };
    onAddHeir(finalValues);
    form.reset();
    setIsAdding(false);
  }

  const handleRemoveHeirLocal = (id: string) => {
      onRemoveHeir(id);
  };

  const openDescendantModal = (parentHeir: Heir) => {
    setParentHeirForDescendant(parentHeir);
    setIsAddingDescendant(true);
  };

  const closeDescendantModal = () => {
    setParentHeirForDescendant(null);
    setIsAddingDescendant(false);
  };

  const handleAddDescendant = (descendantData: Omit<Heir, 'id' | 'descendants'>) => {
    if (parentHeirForDescendant) {
        const newDescendant: Heir = {
            ...descendantData,
            relationship: 'CHILD', 
            id: Date.now().toString(),
            acceptsInheritance: descendantData.isAlive ? descendantData.acceptsInheritance : false,
            requestSeparateHalf: false, 
            descendants: [],
        };
        setHeirs(prevHeirs => addDescendantToHeir(prevHeirs, parentHeirForDescendant.id, newDescendant));
        closeDescendantModal();
    }
  };
  
  const canHaveDescendants = (relationship: Relationship): boolean => {
    return relationship === 'CHILD' ||
           relationship === 'PARENT' ||
           relationship === 'PATERNAL_GRANDFATHER' ||
           relationship === 'PATERNAL_GRANDMOTHER' ||
           relationship === 'MATERNAL_GRANDFATHER' ||
           relationship === 'MATERNAL_GRANDMOTHER' ||
           relationship === 'PGF_F' || relationship === 'PGF_M' ||
           relationship === 'PGM_F' || relationship === 'PGM_M' ||
           relationship === 'MGF_F' || relationship === 'MGF_M' ||
           relationship === 'MGM_F' || relationship === 'MGM_M';
  };

  const getParentHeir = (heirId: string, currentHeirs: Heir[]): Heir | null => {
    for (const h of currentHeirs) {
        if (h.descendants?.some(d => d.id === heirId)) {
            return h;
        }
        if (h.descendants) {
            const parentInDescendants = getParentHeir(heirId, h.descendants);
            if (parentInDescendants) return parentInDescendants;
        }
    }
    return null;
  };


  const RenderHeirItem = useCallback(({ heir, level = 0 }: { heir: Heir, level?: number }) => {
    let displayRelationshipLabel = relationshipLabels[heir.relationship];
    
    if (level > 0 && heir.relationship === 'CHILD') {
        const parentHeir = getParentHeir(heir.id, heirs); 
        if (parentHeir) {
            if (parentHeir.relationship === 'PARENT') { 
                displayRelationshipLabel = `Brat/Sestra (potomak od ${parentHeir.name})`;
            } else if (parentHeir.relationship === 'CHILD') { 
                displayRelationshipLabel = `Unuk/Unuka (potomak od ${parentHeir.name})`;
            } else if (parentHeir.relationship.includes('GRANDFATHER') || parentHeir.relationship.includes('GRANDMOTHER')) {
                displayRelationshipLabel = `Ujak/Stric/Tetka (potomak od ${parentHeir.name})`;
            } else if (parentHeir.relationship.startsWith('PGF_') || parentHeir.relationship.startsWith('PGM_') || parentHeir.relationship.startsWith('MGF_') || parentHeir.relationship.startsWith('MGM_')) {
                 displayRelationshipLabel = `Potomak pradjeda/babe (od ${parentHeir.name})`;
            } else {
                 displayRelationshipLabel = `Potomak (od ${parentHeir.name || 'pretka'})`;
            }
        } else {
             displayRelationshipLabel = "Potomak";
        }
    }


    return (
    <li key={heir.id} className={`flex flex-col p-2 rounded-md border ${level > 0 ? 'ml-6 mt-1 bg-secondary/60 border-secondary' : 'bg-card border-border'}`}>
        <div className="flex items-center justify-between">
            <div className="flex items-center flex-wrap gap-x-1">
                {level > 0 && <CornerDownRight className="mr-1 h-3 w-3 text-muted-foreground flex-shrink-0" />}
                <RelationshipIcon relationship={heir.relationship} />
                <span className='font-medium'>{heir.name}</span>
                <span className='text-sm text-muted-foreground'>({displayRelationshipLabel})</span>
                <StatusIcon isAlive={heir.isAlive} acceptsInheritance={heir.acceptsInheritance} requestSeparateHalf={heir.requestSeparateHalf} />
            </div>
            <div className="flex items-center space-x-1 flex-shrink-0">
                 {!heir.isAlive && canHaveDescendants(heir.relationship) && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => openDescendantModal(heir)} aria-label={`Dodaj nasljednika za ${heir.name}`}>
                                    <PlusCircle className="h-4 w-4 text-primary hover:text-primary/80" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Dodaj potomka za {heir.name}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
                <Button variant="ghost" size="icon" onClick={() => handleRemoveHeirLocal(heir.id)} aria-label={`Ukloni ${heir.name}`}>
                    <Trash2 className="h-4 w-4 text-destructive hover:text-destructive/80" />
                </Button>
            </div>
        </div>
        {heir.descendants && heir.descendants.length > 0 && (
             <ul className="mt-2 space-y-1 border-t border-dashed border-muted pt-2">
                {heir.descendants.map(descendant => (
                    <RenderHeirItem key={descendant.id} heir={descendant} level={level + 1} />
                ))}
            </ul>
        )}
    </li>
  )}, [handleRemoveHeirLocal, openDescendantModal, heirs]);

  return (
    <div className="space-y-6 print:hidden">
       <Card className="border-primary/30 shadow">
        <CardHeader className="bg-primary/5 rounded-t-md">
            <CardTitle className="text-lg flex items-center"><User className="mr-2 h-5 w-5 text-primary" /> Podaci o Ostavioocu</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
             <Input
                placeholder="Ime i prezime ostavioca"
                value={deceasedName}
                onChange={(e) => setDeceasedName(e.target.value)}
                className="mb-2"
                aria-label="Ime i prezime ostavioca"
             />
             <p className="text-sm text-muted-foreground">Unesite ime osobe čije se nasljedstvo dijeli.</p>
        </CardContent>
       </Card>

      <Card className="border-primary/30 shadow">
        <CardHeader className="bg-primary/5 rounded-t-md">
          <CardTitle className="text-lg flex items-center"><Users className="mr-2 h-5 w-5 text-primary" /> Nasljednici</CardTitle>
          <CardDescription>
            Dodajte sve potencijalne zakonske nasljednike. Za preminule nasljednike koji mogu imati potomke po pravu predstavljanja (djecu, roditelje, djedove/babe, pradjedove/prababe), dodajte njihove potomke klikom na ikonu plus.
            Program provjerava nasljedne redove: 1. Djeca/Supružnik; 2. Roditelji/Supružnik (i potomci roditelja - braća/sestre ostavioca); 3. Djedovi/Babe/Supružnik (i njihovi potomci - ujaci/stricevi/tetke ostavioca); 4. Pradjedovi/Prababe (i njihovi potomci).
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {heirs.length > 0 && (
            <ScrollArea className="h-48 mb-4 border rounded-md p-2 bg-secondary/20">
              <ul className="space-y-2">
                {heirs.map((heir) => <RenderHeirItem key={heir.id} heir={heir} />)}
              </ul>
            </ScrollArea>
          )}

          {!isAdding && (
            <Button onClick={() => setIsAdding(true)} variant="outline" className="w-full border-primary/50 text-primary hover:bg-primary/10 hover:text-primary">
             <PlusCircle className="mr-2 h-4 w-4"/> Dodaj Nasljednika
            </Button>
          )}

          {isAdding && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4 border border-dashed border-primary/50 rounded-md bg-secondary/50 mt-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ime Nasljednika</FormLabel>
                      <FormControl>
                        <Input placeholder="Npr. Marko Marković" {...field} aria-required="true" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="relationship"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                         <FormLabel>Odnos prema Ostavioocu</FormLabel>
                      </div>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl>
                          <SelectTrigger aria-required="true">
                            <SelectValue placeholder="Izaberite odnos" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(relationshipLabels).map(([key, label]) => (
                            <SelectItem key={key} value={key as Relationship}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                    control={form.control}
                    name="isAlive"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-background">
                        <div className="space-y-0.5">
                            <FormLabel>Da li je nasljednik živ?</FormLabel>
                            <FormDescription>
                              Ako nije živ, za određene srodnike moći ćete dodati njihove potomke nakon što sačuvate ovog nasljednika.
                            </FormDescription>
                        </div>
                        <FormControl>
                            <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            aria-label="Da li je nasljednik živ"
                            />
                        </FormControl>
                        </FormItem>
                    )}
                 />

                 <FormField
                    control={form.control}
                    name="acceptsInheritance"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-background">
                        <div className="space-y-0.5">
                            <FormLabel>Da li se prihvata nasljedstva?</FormLabel>
                            <FormDescription>
                              Ako se živ nasljednik ne prihvata, njegov dio dijele ostali. Preminuli ne mogu prihvatiti.
                            </FormDescription>
                        </div>
                        <FormControl>
                            <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={!isAliveValue}
                            aria-label="Da li se prihvata nasljedstva"
                            />
                        </FormControl>
                        </FormItem>
                    )}
                 />

                 {relationshipValue === 'SPOUSE' && isAliveValue && acceptsInheritanceValue && (
                     <FormField
                        control={form.control}
                        name="requestSeparateHalf"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700">
                            <div className="space-y-0.5">
                                <FormLabel className="text-blue-800 dark:text-blue-300 flex items-center"><Scaling className='mr-2 h-4 w-4'/> Da li traži izdvajanje polovine?</FormLabel>
                                <FormDescription className="text-blue-700 dark:text-blue-400">
                                    Ako supružnik ovo zatraži, dobija 1/2 imovine odmah, a ostatak se dijeli zakonski.
                                </FormDescription>
                            </div>
                            <FormControl>
                                <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                aria-label="Da li supružnik traži izdvajanje polovine"
                                />
                            </FormControl>
                            </FormItem>
                        )}
                     />
                 )}


                <div className="flex justify-end space-x-2 pt-2">
                    <Button type="button" variant="ghost" onClick={() => { setIsAdding(false); form.reset(); }}>Odustani</Button>
                    <Button type="submit">Sačuvaj Nasljednika</Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>

        {parentHeirForDescendant && (
            <DescendantFormModal
                isOpen={isAddingDescendant}
                onClose={closeDescendantModal}
                onAddDescendant={handleAddDescendant}
                parentName={parentHeirForDescendant.name}
            />
        )}
    </div>
  );
}