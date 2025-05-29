
"use client";

import type React from 'react';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Card, CardContent, CardDescription as ShadCnCardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, PlusCircle, ArrowRightLeft, Divide, Info, AlertTriangle } from 'lucide-react';
import type { Heir, Fraction, DonationRule } from '@/types/heir';
import { addFractions, subtractFractions, simplifyFraction, compareFractions } from '@/lib/inheritance-calculator';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Schema for validating the donation portion input (fraction of donor's share)
const portionSchema = z.string().regex(/^\s*\d+\s*\/\s*\d+\s*$/, {
    message: "Format: 'brojilac / imenilac' (npr. '1 / 2')"
}).transform((val, ctx) => {
    const parts = val.split('/').map(part => part.trim());
    const numerator = parseInt(parts[0], 10);
    const denominator = parseInt(parts[1], 10);
    if (isNaN(numerator) || isNaN(denominator) || denominator <= 0 || numerator < 0 ) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Neispravan razlomak. Brojilac mora biti >= 0, imenilac > 0.",
        });
        return z.NEVER;
    }
     if (numerator > denominator) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Brojilac ne može biti veći od imenioca za ovaj unos.",
        });
        return z.NEVER;
    }
    return { numerator, denominator };
});


const redistributionFormSchema = z.object({
    donorId: z.string().min(1, { message: "Molimo izaberite donatora." }),
    recipientId: z.string().min(1, { message: "Molimo izaberite primaoca." }),
    portionOfShare: portionSchema, // This is now fraction of DONOR'S share
}).refine(data => data.donorId !== data.recipientId, {
    message: "Donator i primalac ne mogu biti ista osoba.",
    path: ["recipientId"],
});


type RedistributionFormValues = z.infer<typeof redistributionFormSchema>;

interface RedistributionFormProps {
    eligibleHeirs: Heir[];
    donationRules: DonationRule[];
    setDonationRules: React.Dispatch<React.SetStateAction<DonationRule[]>>;
    initialShares: Record<string, Fraction> | null;
}

const F_ONE: Fraction = { numerator: 1, denominator: 1 };
const F_ZERO: Fraction = { numerator: 0, denominator: 1 };

const findHeirName = (heirs: Heir[], id: string): string => {
    const heir = heirs.find(h => h.id === id);
    return heir ? heir.name : 'Nepoznat';
};

const formatFractionDisplay = (fraction: Fraction | null | undefined): string => {
    if (!fraction || typeof fraction.numerator === 'undefined' || typeof fraction.denominator === 'undefined') return "0/1";
    const simplified = simplifyFraction(fraction);
    if (simplified.denominator === 0) return "N/A";
    if (simplified.numerator === 0) return "0";
    if (simplified.denominator === 1 && simplified.numerator !==0) return simplified.numerator.toString();
    return `${simplified.numerator}/${simplified.denominator}`;
};

interface DonorAllocationInfo {
    initialAbsoluteShare: Fraction;
    totalRelativePortionAllocatedByDonor: Fraction;
    maxRelativePortionForNewRule: Fraction;
    isFullyAllocated: boolean;
}

export function RedistributionForm({ eligibleHeirs, donationRules, setDonationRules, initialShares }: RedistributionFormProps) {
    const [isAddingRule, setIsAddingRule] = useState(false);
    const [selectedDonorAllocationInfo, setSelectedDonorAllocationInfo] = useState<DonorAllocationInfo | null>(null);
    
    const noEligibleDonors = eligibleHeirs.length === 0;

    const form = useForm<RedistributionFormValues>({
        resolver: zodResolver(redistributionFormSchema),
        defaultValues: {
            donorId: '',
            recipientId: '',
            portionOfShare: '0 / 1',
        },
        mode: "onChange",
    });

    const { setError, clearErrors, formState: { errors }, watch, setValue, reset } = form;
    const selectedDonorId = watch('donorId');
    const currentPortionString = watch('portionOfShare');

    useEffect(() => {
        if (selectedDonorId && initialShares) {
            const donorInitialAbsoluteShare = initialShares[selectedDonorId] || F_ZERO;

            let totalRelativePortionAllocated: Fraction = F_ZERO;
            donationRules.forEach(rule => {
                if (rule.donorId === selectedDonorId) {
                    totalRelativePortionAllocated = addFractions(totalRelativePortionAllocated, rule.portionOfShare);
                }
            });
            totalRelativePortionAllocated = simplifyFraction(totalRelativePortionAllocated);

            const maxNewRuleRelative = subtractFractions(F_ONE, totalRelativePortionAllocated);

            setSelectedDonorAllocationInfo({
                initialAbsoluteShare: simplifyFraction(donorInitialAbsoluteShare),
                totalRelativePortionAllocatedByDonor: totalRelativePortionAllocated,
                maxRelativePortionForNewRule: simplifyFraction(maxNewRuleRelative.numerator < 0 ? F_ZERO : maxNewRuleRelative),
                isFullyAllocated: compareFractions(totalRelativePortionAllocated, F_ONE) >= 0,
            });
        } else {
            setSelectedDonorAllocationInfo(null);
        }
    }, [selectedDonorId, initialShares, donationRules]);


    useEffect(() => {
        const currentZodError = errors.portionOfShare?.type === "invalid_string" || errors.portionOfShare?.type === "custom";

        if (currentZodError) return;

        clearErrors("portionOfShare"); 

        const parsedResult = portionSchema.safeParse(currentPortionString);

        if (!parsedResult.success) { 
            return;
        }
        const parsedPortion = parsedResult.data;

        if (selectedDonorAllocationInfo) {
            const maxAllowedForNew = selectedDonorAllocationInfo.maxRelativePortionForNewRule;

            if (selectedDonorAllocationInfo.isFullyAllocated && parsedPortion.numerator > 0 && compareFractions(selectedDonorAllocationInfo.totalRelativePortionAllocatedByDonor, F_ONE) === 0) {
                 setError("portionOfShare", {
                    type: "manual_fully_allocated",
                    message: `Donator je već alocirao 100% svog dijela. Unesite '0 / 1' ili izmijenite postojeća pravila.`
                });
            } else if (compareFractions(parsedPortion, maxAllowedForNew) > 0) {
                 setError("portionOfShare", {
                    type: "manual_exceeds_remaining_share",
                    message: `Ne možete dodijeliti više od preostalog dijela donatora (${formatFractionDisplay(maxAllowedForNew)} njegovog početnog udjela).`
                });
            }
        }
    }, [currentPortionString, selectedDonorAllocationInfo, errors.portionOfShare, setError, clearErrors]);


    function onSubmit(values: RedistributionFormValues) {
        const newRule: DonationRule = {
            id: Date.now().toString(),
            donorId: values.donorId,
            recipientId: values.recipientId,
            portionOfShare: values.portionOfShare, 
        };

        setDonationRules(prev => [...prev, newRule]);
        reset({ // Use reset from useForm
          donorId: selectedDonorId, 
          recipientId: '',
          portionOfShare: '0 / 1',
        });
        // Keep form open if donor has more to allocate, or manage isAddingRule based on allocation
        // If selectedDonorAllocationInfo indicates full allocation after this rule, could set isAddingRule to false
    }

    const handleRemoveRule = (id: string) => {
        setDonationRules(prev => prev.filter(rule => rule.id !== id));
    };

    const isPortionInputEffectivelyDisabled = (selectedDonorAllocationInfo?.isFullyAllocated && compareFractions(selectedDonorAllocationInfo.totalRelativePortionAllocatedByDonor, F_ONE) === 0) ?? false;

    const handleOpenAddRuleForm = () => {
        setIsAddingRule(true);
        reset({ donorId: '', recipientId: '', portionOfShare: '0 / 1' });
        setSelectedDonorAllocationInfo(null);
        clearErrors();
    };
    
    const handleCloseAddRuleForm = () => {
        setIsAddingRule(false);
        reset({ donorId: '', recipientId: '', portionOfShare: '0 / 1' });
        setSelectedDonorAllocationInfo(null);
        clearErrors();
    };

    return (
        <Card className="mt-6 border-primary/30 shadow">
            <CardHeader className="bg-primary/5 rounded-t-md">
                <CardTitle className="text-lg flex items-center"><ArrowRightLeft className="mr-2 h-5 w-5 text-primary" /> Preraspodjela Nasljednih Dijelova (Opciono)</CardTitle>
                <ShadCnCardDescription>
                    Definišite kako nasljednici ustupaju svoje dijelove drugim nasljednicima.
                    Ustupiti mogu samo živi nasljednici koji prihvataju nasljedstvo i imaju dio veći od nule.
                    Ako donator odluči da ustupi dio svog nasljedstva, **mora ustupiti cjelokupan svoj nasljedni dio** jednom ili više primalaca.
                    Unesite dio **početnog udjela DONATORA** koji se ustupa svakom primaocu (npr. '1/2' ako donator ustupa polovinu svog dijela tom primaocu).
                    Zbir svih ustupljenih dijelova od strane jednog donatora mora biti tačno 100% (ili 1/1) njegovog početnog udjela da bi ustupanje bilo važeće.
                </ShadCnCardDescription>
            </CardHeader>
            <CardContent className="pt-4">
                {donationRules.length > 0 && (
                    <ScrollArea className="h-36 mb-4 border rounded-md p-2 bg-secondary/20">
                        <ul className="space-y-2">
                            {donationRules.map((rule) => (
                                <li key={rule.id} className="flex items-center justify-between p-2 rounded-md bg-card border border-border">
                                    <div className="flex items-center space-x-1 text-sm flex-wrap gap-x-1">
                                        <span className="font-medium">{findHeirName(eligibleHeirs, rule.donorId)}</span>
                                        <ArrowRightLeft className="h-3 w-3 text-muted-foreground" />
                                        <span className="font-medium">{findHeirName(eligibleHeirs, rule.recipientId)}</span>
                                        <span className="text-muted-foreground ml-1 whitespace-nowrap">
                                            ({formatFractionDisplay(rule.portionOfShare)} <span className="italic text-xs">donatorovog dijela</span>)
                                        </span>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveRule(rule.id)} aria-label={`Ukloni pravilo ${rule.id}`}>
                                        <Trash2 className="h-4 w-4 text-destructive hover:text-destructive/80" />
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    </ScrollArea>
                )}

                {!isAddingRule && (
                    <Button 
                        onClick={handleOpenAddRuleForm}
                        variant="outline" 
                        className="w-full border-primary/50 text-primary hover:bg-primary/10 hover:text-primary"
                        disabled={noEligibleDonors && !!initialShares} // Disable if no eligible donors AND initial calculation is done
                    >
                       <PlusCircle className="mr-2 h-4 w-4" /> Dodaj Pravilo Preraspodjele
                    </Button>
                )}
                 {isAddingRule && noEligibleDonors && !!initialShares && (
                    <Alert variant="default" className="my-4 bg-yellow-50 border-yellow-300 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-700 dark:text-yellow-300">
                        <AlertTriangle className="h-5 w-5 !text-yellow-600 dark:!text-yellow-400" />
                        <AlertTitle className="font-semibold">Nema dostupnih donatora</AlertTitle>
                        <AlertDescription>
                            Nijedan nasljednik trenutno ne ispunjava uslove da ustupi svoj dio. Donator mora biti živ, prihvatiti nasljedstvo i imati nasljedni dio veći od nule nakon početnog obračuna.
                        </AlertDescription>
                    </Alert>
                )}


                {isAddingRule && (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4 border border-dashed border-primary/50 rounded-md bg-secondary/50 mt-4">
                            {!noEligibleDonors && (
                                <>
                                    <FormField
                                        control={form.control}
                                        name="donorId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Donator (Ko ustupa dio)</FormLabel>
                                                <Select 
                                                    onValueChange={(value) => {
                                                        field.onChange(value);
                                                        setValue('portionOfShare', '0 / 1');
                                                        setValue('recipientId', '');
                                                        clearErrors("portionOfShare");
                                                    }} 
                                                    value={field.value || ''}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger aria-required="true">
                                                            <SelectValue placeholder="Izaberite donatora" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {eligibleHeirs.map(heir => (
                                                            <SelectItem 
                                                                key={heir.id} 
                                                                value={heir.id} 
                                                                disabled={!initialShares || initialShares[heir.id]?.numerator === 0}
                                                            >
                                                                {heir.name} {(!initialShares || initialShares[heir.id]?.numerator === 0) ? "(nema udjela)" : `(${formatFractionDisplay(initialShares ? initialShares[heir.id] : F_ZERO)} ukupno)`}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    {selectedDonorAllocationInfo && selectedDonorId && initialShares && initialShares[selectedDonorId]?.numerator !== 0 && (
                                        <Card className={`p-3 text-sm border ${selectedDonorAllocationInfo.isFullyAllocated && compareFractions(selectedDonorAllocationInfo.totalRelativePortionAllocatedByDonor, F_ONE) !== 0 ? 'bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-700' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'}`}>
                                            <CardHeader className="p-0 mb-2">
                                                <CardTitle className={`text-base flex items-center ${selectedDonorAllocationInfo.isFullyAllocated && compareFractions(selectedDonorAllocationInfo.totalRelativePortionAllocatedByDonor, F_ONE) !== 0 ? 'text-red-700 dark:text-red-300' : 'text-blue-700 dark:text-blue-300'}`}>
                                                    {selectedDonorAllocationInfo.isFullyAllocated && compareFractions(selectedDonorAllocationInfo.totalRelativePortionAllocatedByDonor, F_ONE) !== 0 ? <AlertTriangle size={16} className="mr-2"/> : <Info size={16} className="mr-2"/>}
                                                    Status alokacije za: {findHeirName(eligibleHeirs, selectedDonorId)}
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className={`p-0 space-y-1 ${selectedDonorAllocationInfo.isFullyAllocated && compareFractions(selectedDonorAllocationInfo.totalRelativePortionAllocatedByDonor, F_ONE) !== 0 ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>
                                                <p>Početni udio donatora: <span className="font-semibold">{formatFractionDisplay(selectedDonorAllocationInfo.initialAbsoluteShare)}</span> <span className="italic text-xs">cjelokupne zaostavštine.</span></p>
                                                <p>Do sada alocirano (drugim pravilima): <span className="font-semibold">{formatFractionDisplay(selectedDonorAllocationInfo.totalRelativePortionAllocatedByDonor)}</span> <span className="italic text-xs">donatorovog početnog udjela.</span></p>
                                                {selectedDonorAllocationInfo.isFullyAllocated ?
                                                    (compareFractions(selectedDonorAllocationInfo.totalRelativePortionAllocatedByDonor, F_ONE) === 0 ?
                                                        <p className="font-semibold text-green-700 dark:text-green-400">Donator je alocirao 100% svog dijela.</p>
                                                        : <p className="font-semibold">Donator NIJE ISPRAVNO alocirao 100% svog dijela (trenutno: {formatFractionDisplay(selectedDonorAllocationInfo.totalRelativePortionAllocatedByDonor)}). Njegove donacije neće biti važeće.</p>
                                                    )
                                                    : <p>Preostalo za alokaciju: <span className="font-semibold">{formatFractionDisplay(selectedDonorAllocationInfo.maxRelativePortionForNewRule)}</span> <span className="italic text-xs">donatorovog početnog udjela.</span></p>
                                                }
                                                {compareFractions(selectedDonorAllocationInfo.totalRelativePortionAllocatedByDonor, F_ONE) !== 0 && (
                                                    <p className="text-amber-700 dark:text-amber-500 font-medium">UPOZORENJE: Da bi ustupanje bilo važeće, zbir svih ustupljenih dijelova ovog donatora mora biti tačno 100% (1/1) njegovog početnog udjela.</p>
                                                )}
                                            </CardContent>
                                        </Card>
                                    )}
                                    <FormField
                                        control={form.control}
                                        name="recipientId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Primalac (Kome se ustupa dio)</FormLabel>
                                                <Select 
                                                    onValueChange={field.onChange} 
                                                    value={field.value || ''} 
                                                    disabled={!selectedDonorId || (initialShares && initialShares[selectedDonorId]?.numerator === 0)}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger aria-required="true">
                                                            <SelectValue placeholder="Izaberite primaoca" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {eligibleHeirs
                                                        .filter(heir => heir.id !== form.watch('donorId'))
                                                        .map(heir => (
                                                            <SelectItem key={heir.id} value={heir.id}>
                                                                {heir.name}
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
                                        name="portionOfShare"
                                        render={({ field: { onChange, value, ...rest } }) => {
                                        const displayValue = typeof value === 'object' ? `${value.numerator} / ${value.denominator}` : value;
                                        return (
                                            <FormItem>
                                                <FormLabel className="flex items-center">Dio Donatorovog Udjela Koji Se Ustupa <Divide className="ml-1 h-3 w-3 opacity-70" /></FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Npr. 1 / 2 (za polovinu DJELA DONATORA)"
                                                        value={displayValue}
                                                        onChange={(e) => onChange(e.target.value)}
                                                        aria-required="true"
                                                        {...rest}
                                                        disabled={isPortionInputEffectivelyDisabled || !selectedDonorId || (initialShares && initialShares[selectedDonorId]?.numerator === 0)}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    Unesite dio **početnog udjela donatora** koji se ustupa ovom primaocu (npr. '1/2' ako donator ustupa polovinu svog dijela).
                                                    Ako je donator već alocirao 100% svog dijela, možete unijeti samo '0 / 1'.
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        );
                                        }}
                                    />
                                </>
                            )}
                            <div className="flex justify-end space-x-2 pt-2">
                                <Button type="button" variant="ghost" onClick={handleCloseAddRuleForm}>Zatvori Formu</Button>
                                {!noEligibleDonors && (
                                     <Button type="submit" disabled={!form.formState.isValid || !selectedDonorId || (initialShares && initialShares[selectedDonorId]?.numerator === 0) || (selectedDonorAllocationInfo?.isFullyAllocated && compareFractions(selectedDonorAllocationInfo.totalRelativePortionAllocatedByDonor,F_ONE) !==0 ) }>Sačuvaj Pravilo</Button>
                                )}
                            </div>
                        </form>
                    </Form>
                )}
            </CardContent>
        </Card>
    );
}


    