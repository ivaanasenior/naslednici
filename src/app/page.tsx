
"use client";

import { useState, useEffect, useCallback } from 'react';
import { HeirForm } from '@/components/heir-form';
import { ResultsDisplay } from '@/components/results-display';
import { RedistributionForm } from '@/components/redistribution-form';
import { calculateInitialInheritance, applyRedistributions, convertToCommonDenominator } from '@/lib/inheritance-calculator';
import type { Heir, Fraction, DonationRule } from '@/types/heir';
import { removeHeirByIdRecursive, flattenHeirs } from '@/lib/heir-utils';
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Scale, Files } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";


export default function Home() {
  const [deceasedName, setDeceasedName] = useState<string>('');
  const [heirs, setHeirs] = useState<Heir[]>([]);
  const [results, setResults] = useState<Record<string, Fraction> | null>(null);
  const [donationRules, setDonationRules] = useState<DonationRule[]>([]);
  const [initialSharesBeforeRedistribution, setInitialSharesBeforeRedistribution] = useState<Record<string, Fraction> | null>(null);
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);

  // State for tax calculation
  const [showTaxInput, setShowTaxInput] = useState(false);
  const [totalTaxAmount, setTotalTaxAmount] = useState<string>('');
  const [heirTaxes, setHeirTaxes] = useState<Record<string, number> | null>(null);

  const { toast } = useToast();

  const handleAddHeir = (heir: Heir) => {
    setHeirs(prev => [...prev, heir]);
    setResults(null);
    setInitialSharesBeforeRedistribution(null);
    setDonationRules([]);
    setHeirTaxes(null);
    setShowTaxInput(false);
  };

  const handleRemoveHeir = (id: string) => {
    const newHeirs = removeHeirByIdRecursive(heirs, id);
    setHeirs(newHeirs);
    setResults(null);
    setInitialSharesBeforeRedistribution(null);
    setHeirTaxes(null);
    setShowTaxInput(false);
    
    setDonationRules(prevRules => 
        prevRules.filter(rule => rule.donorId !== id && rule.recipientId !== id)
    );
  };

  const handleCalculate = useCallback(() => {
    if (!deceasedName.trim()) {
        toast({
            title: "Greška",
            description: "Molimo unesite ime ostavioca.",
            variant: "destructive",
        });
        return;
    }
    if (heirs.length === 0) {
         toast({
            title: "Informacija",
            description: "Nema unesenih nasljednika za obračun.",
            variant: "default",
        });
        setResults({}); 
        setInitialSharesBeforeRedistribution({});
        setHeirTaxes(null);
        setShowTaxInput(false);
        return;
    }

    const initial = calculateInitialInheritance(heirs);
    setInitialSharesBeforeRedistribution(initial);

    const { finalShares, warnings } = applyRedistributions(initial, donationRules, heirs);
    
    warnings.forEach(warning => {
        toast({
            title: "Upozorenje o Preraspodjeli",
            description: warning.message,
            variant: warning.type === 'donor_incomplete_allocation' ? "destructive" : "default", 
            duration: 7000, 
        });
    });
    
    const commonDenominatorResults = convertToCommonDenominator(finalShares);
    setResults(commonDenominatorResults);
    setHeirTaxes(null); // Reset taxes when main calculation changes
    setShowTaxInput(false);

  }, [heirs, donationRules, deceasedName, toast]);


  useEffect(() => {
    if(results || (initialSharesBeforeRedistribution && Object.keys(initialSharesBeforeRedistribution).length > 0) ) { 
        handleCalculate();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heirs, donationRules, deceasedName]); 

  // Reset taxes if main results are cleared
  useEffect(() => {
    if (!results) {
      setHeirTaxes(null);
      setShowTaxInput(false);
      setTotalTaxAmount('');
    }
  }, [results]);


  const getEligibleHeirsForDonation = (): Heir[] => {
    if (!initialSharesBeforeRedistribution) return [];
    
    const allHeirsFlat = flattenHeirs(heirs);
    return allHeirsFlat.filter(heir => 
      heir.isAlive && 
      heir.acceptsInheritance &&
      initialSharesBeforeRedistribution[heir.id] &&
      initialSharesBeforeRedistribution[heir.id].numerator > 0 
    );
  };

  const handleResetAll = () => {
    setDeceasedName('');
    setHeirs([]);
    setResults(null);
    setDonationRules([]);
    setInitialSharesBeforeRedistribution(null);
    setShowResetConfirmation(false);
    setHeirTaxes(null);
    setShowTaxInput(false);
    setTotalTaxAmount('');
    toast({
        title: "Resetovano",
        description: "Svi podaci su obrisani.",
    });
  };

  const calculateAndSetHeirTaxes = () => {
    const parsedTotalTax = parseFloat(totalTaxAmount);
    if (isNaN(parsedTotalTax) || parsedTotalTax < 0) {
      toast({
        title: "Greška",
        description: "Molimo unesite validan ukupan iznos takse.",
        variant: "destructive",
      });
      return;
    }

    if (!results) {
      toast({
        title: "Greška",
        description: "Prvo izračunajte nasljedne dijelove.",
        variant: "destructive",
      });
      return;
    }

    const newHeirTaxes: Record<string, number> = {};
    let totalNumeratorSum = 0;
    let commonDenominator = 1;

    Object.values(results).forEach(fraction => {
      if (fraction && fraction.denominator > 0) {
        commonDenominator = fraction.denominator; // Should be same for all from convertToCommonDenominator
        totalNumeratorSum += fraction.numerator;
      }
    });
    
    if (commonDenominator === 0 || totalNumeratorSum === 0) { // Avoid division by zero if no one inherits anything
        flattenHeirs(heirs).forEach(heir => {
            newHeirTaxes[heir.id] = 0;
        });
        setHeirTaxes(newHeirTaxes);
        setShowTaxInput(false);
        toast({
          title: "Obračun Taksi",
          description: "Takse su obračunate (0 jer nema nasljednog dijela).",
        });
        return;
    }


    for (const heirId in results) {
      const share = results[heirId];
      if (share && share.numerator > 0 && share.denominator > 0) {
        // commonDenominator should be the same for all results from convertToCommonDenominator
        // totalNumeratorSum should equal commonDenominator if entire estate is distributed
        const proportion = share.numerator / share.denominator; // Proportion of the total estate
        newHeirTaxes[heirId] = proportion * parsedTotalTax;
      } else {
        newHeirTaxes[heirId] = 0;
      }
    }
    setHeirTaxes(newHeirTaxes);
    setShowTaxInput(false);
    toast({
      title: "Obračun Taksi",
      description: "Sudske takse su uspješno obračunate.",
    });
  };


  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center p-4 md:p-8">
      <header className="w-full max-w-4xl mb-6 md:mb-10 text-center">
        <div className="flex items-center justify-center mb-2 text-primary">
           <Scale size={50} className="text-primary" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-primary">Kalkulator nasljedstva</h1>
      </header>

      <main className="w-full max-w-4xl space-y-6">
        <HeirForm
          onAddHeir={handleAddHeir}
          heirs={heirs}
          onRemoveHeir={handleRemoveHeir}
          deceasedName={deceasedName}
          setDeceasedName={setDeceasedName}
          setHeirs={setHeirs}
        />
        
        {heirs.length > 0 && initialSharesBeforeRedistribution && Object.keys(initialSharesBeforeRedistribution).length > 0 && (
            <RedistributionForm
                eligibleHeirs={getEligibleHeirsForDonation()}
                donationRules={donationRules}
                setDonationRules={setDonationRules}
                initialShares={initialSharesBeforeRedistribution}
            />
        )}

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 print-hidden">
            <Button 
                onClick={handleCalculate} 
                size="lg" 
                className="w-full sm:w-auto bg-accent hover:bg-accent-hover text-accent-foreground px-8 py-3 text-lg shadow-md"
                disabled={!deceasedName.trim()}
            >
                Izračunaj Nasljedstvo
            </Button>
            <AlertDialog open={showResetConfirmation} onOpenChange={setShowResetConfirmation}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="lg" className="w-full sm:w-auto px-8 py-3 text-lg shadow-md">
                  Resetuj Sve Podatke
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Potvrda resetovanja</AlertDialogTitle>
                  <AlertDialogDescription>
                    Da li ste sigurni da želite da obrišete sve unesene podatke o ostaviocu, nasljednicima i pravilima preraspodjele? Ova akcija se ne može opozvati.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setShowResetConfirmation(false)}>Odustani</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResetAll}>Obriši Sve</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
        </div>

        {results && (
          <ResultsDisplay results={results} heirs={heirs} deceasedName={deceasedName} donationRules={donationRules} heirTaxes={heirTaxes} />
        )}

        {results && Object.keys(results).length > 0 && !heirTaxes && !showTaxInput && (
          <div className="mt-6 flex justify-center print-hidden">
            <Button 
              variant="outline" 
              onClick={() => setShowTaxInput(true)} 
              className="text-primary border-primary/50 hover:bg-[hsl(var(--primary-hover))] hover:text-primary-foreground"
            >
              <Files className="mr-2 h-4 w-4" /> Želite li da izračunate i sudske takse za nasljednike?
            </Button>
          </div>
        )}

        {showTaxInput && (
          <Card className="mt-6 print-hidden border-primary/30 shadow">
            <CardHeader className="bg-primary/5 rounded-t-md">
              <CardTitle className="text-lg flex items-center"><Files className="mr-2 h-5 w-5 text-primary" />Obračun Sudske Takse</CardTitle>
              <CardDescription>Unesite ukupan iznos sudske takse koja će biti raspoređena na nasljednike srazmjerno njihovim dijelovima.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div>
                <Label htmlFor="totalTaxAmount" className="mb-2 block">Ukupan iznos sudske takse</Label>
                <Input
                  id="totalTaxAmount"
                  type="number"
                  value={totalTaxAmount}
                  onChange={(e) => setTotalTaxAmount(e.target.value)}
                  placeholder="Unesite ukupan iznos takse"
                  className="w-full"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="ghost" onClick={() => {setShowTaxInput(false); setTotalTaxAmount('');}}>Odustani</Button>
                <Button onClick={calculateAndSetHeirTaxes} className="bg-accent hover:bg-accent-hover text-accent-foreground">Obračunaj takse</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
      <footer className="w-full max-w-4xl mt-10 pt-6 border-t border-border text-center text-sm text-muted-foreground print-hidden">
         <p>Napravljeno sa ljubavlju za kolege Osnovnog suda u Foči. E-mail za sugestije: dragan.osfoca@gmail.com.</p>
      </footer>
    </div>
  );
}