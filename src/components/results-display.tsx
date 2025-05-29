
import type React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Award, CheckCircle, Divide, XCircle, HelpCircle, CornerDownRight, Scaling, ArrowRightLeft, Files } from 'lucide-react';
import type { Heir, Fraction, Relationship, DonationRule } from '@/types/heir';
import { flattenHeirs } from '@/lib/heir-utils';

interface ResultsDisplayProps {
  results: Record<string, Fraction>;
  heirs: Heir[];
  deceasedName: string;
  donationRules: DonationRule[];
  heirTaxes?: Record<string, number> | null; // Prop is now correctly defined as optional
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

const formatFraction = (fraction: Fraction): string => {
  if (!fraction) return "0";
  if (fraction.denominator === 0 || isNaN(fraction.numerator) || isNaN(fraction.denominator)) return "Greška";
  if (fraction.numerator === 0) return "0";
  if (fraction.denominator === 1) return fraction.numerator.toString();
  return `${fraction.numerator}/${fraction.denominator}`;
};


const hasInheritors = (results: Record<string, Fraction>): boolean => {
    return Object.values(results).some(fraction => fraction?.numerator > 0 && fraction?.denominator > 0);
};

const StatusIconDisplay = ({ isAlive, acceptsInheritance, requestSeparateHalf }: { isAlive: boolean, acceptsInheritance: boolean, requestSeparateHalf?: boolean }) => {
     const icons = [];
     if (!isAlive) {
       icons.push(
         <TooltipProvider key="deceased">
           <Tooltip>
             <TooltipTrigger asChild>
               <HelpCircle className="ml-1 h-4 w-4 text-muted-foreground inline-block cursor-help" />
             </TooltipTrigger>
             <TooltipContent><p>Preminuo/la</p></TooltipContent>
           </Tooltip>
         </TooltipProvider>
       );
     } else {
         if (acceptsInheritance) {
             icons.push(
                 <TooltipProvider key="accepts">
                 <Tooltip>
                     <TooltipTrigger asChild><CheckCircle className="ml-1 h-4 w-4 text-green-600 inline-block cursor-help" /></TooltipTrigger>
                     <TooltipContent><p>Prihvata nasljedstvo</p></TooltipContent>
                 </Tooltip>
                 </TooltipProvider>
             );
             if (requestSeparateHalf) {
                  icons.push(
                     <TooltipProvider key="separateHalf">
                         <Tooltip>
                             <TooltipTrigger asChild><Scaling className="ml-1 h-4 w-4 text-blue-600 inline-block cursor-help" /></TooltipTrigger>
                             <TooltipContent><p>Traži izdvajanje polovine</p></TooltipContent>
                         </Tooltip>
                     </TooltipProvider>
                  );
             }
         } else {
              icons.push(
                  <TooltipProvider key="rejects">
                     <Tooltip>
                     <TooltipTrigger asChild><XCircle className="ml-1 h-4 w-4 text-destructive inline-block cursor-help" /></TooltipTrigger>
                     <TooltipContent><p>Ne prihvata nasljedstvo</p></TooltipContent>
                     </Tooltip>
                  </TooltipProvider>
              );
         }
     }
     return <>{icons}</>;
};

interface DisplayHeirInfo {
  heir: Heir;
  displayLevel: number;
  parent?: Heir | null; // Changed to allow null
  grandParent?: Heir | null; // Changed to allow null
}


const flattenHeirsForDisplayWithAncestry = (
    heirList: Heir[],
    initialHeirs: Heir[], // Always pass the top-level 'heirs' array here for ancestry lookup
    level = 0,
    currentParent: Heir | null = null,
    currentGrandParent: Heir | null = null
): DisplayHeirInfo[] => {
    let flatList: DisplayHeirInfo[] = [];
    heirList.forEach(heir => {
        flatList.push({
            heir: heir,
            displayLevel: level,
            parent: currentParent,
            grandParent: currentGrandParent
        });
        if (heir.descendants && heir.descendants.length > 0) {
            // When going deeper, the current heir becomes the parent, and currentParent becomes the grandparent
            flatList = flatList.concat(flattenHeirsForDisplayWithAncestry(heir.descendants, initialHeirs, level + 1, heir, currentParent));
        }
    });
    return flatList;
};


export function ResultsDisplay({ results, heirs, deceasedName, donationRules, heirTaxes }: ResultsDisplayProps) {
   const anyInheritors = hasInheritors(results);
   const flattenedHeirsForTable = flattenHeirsForDisplayWithAncestry(heirs, heirs);
   const allHeirsMap = new Map<string, Heir>(flattenHeirs(heirs).map(h => [h.id, h]));

   const getAllPotentialHeirs = (hList: Heir[]): Heir[] => {
       let potentials: Heir[] = [];
       hList.forEach(h => {
           if(h.isAlive && h.acceptsInheritance) potentials.push(h);
           if (h.descendants) potentials = potentials.concat(getAllPotentialHeirs(h.descendants));
       });
       return potentials;
   }
   const potentialHeirsExist = getAllPotentialHeirs(heirs).length > 0;

  return (
    <Card className="mt-6 shadow-md border-accent/50 print-section print:mt-0 print:shadow-none print:border-none print:rounded-none">
      <CardHeader className="bg-accent/5 rounded-t-lg print:border-b print:pb-2 print:mb-4">
        <CardTitle className="text-xl md:text-2xl font-semibold text-accent flex items-center print:text-lg print:text-black">
          <Award className="mr-2 h-6 w-6 print:hidden" /> Rezultati Nasljedstva za: <span className="ml-1 font-bold">{deceasedName}</span>
        </CardTitle>
        <CardDescription className="print:text-sm print:text-gray-600">Prikaz izračunatih nasljednih dijelova svedenih na zajednički imenilac.</CardDescription>
      </CardHeader>
      <CardContent className="pt-4 print:p-0">
        <Table className="print:text-xs">
          <TableHeader>
            <TableRow className="bg-secondary/50 print:bg-white">
              <TableHead className="print:p-1">Nasljednik</TableHead>
              <TableHead className="print:p-1 print:hidden md:table-cell">Status</TableHead>
              <TableHead className="print:p-1">Odnos/Veza</TableHead>
              <TableHead className="text-right print:p-1">Nasljedni Dio</TableHead>
              {heirTaxes && <TableHead className="text-right print:p-1">Sudska Taksa</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {flattenedHeirsForTable.length > 0 ? flattenedHeirsForTable.map((item) => {
              const heir = item.heir;
              const share = results[heir.id] || { numerator: 0, denominator: 1 };
              const hasPositiveShare = share.numerator > 0;
              const statusIcons = StatusIconDisplay({ isAlive: heir.isAlive, acceptsInheritance: heir.acceptsInheritance, requestSeparateHalf: heir.requestSeparateHalf });
              const taxAmount = heirTaxes ? heirTaxes[heir.id] : undefined;

              let displayRelationshipText = relationshipLabels[heir.relationship];

              if (item.displayLevel > 0 && heir.relationship === 'CHILD') { 
                const parentHeir = item.parent;
                const grandParentHeir = item.grandParent;

                if (parentHeir) {
                    const parentRelationship = parentHeir.relationship;
                    const parentName = parentHeir.name;

                    if (parentRelationship === 'CHILD') { 
                        if (grandParentHeir && grandParentHeir.relationship === 'CHILD') { 
                            displayRelationshipText = `Praunuk/a (od ${parentName}, unuk/a od ${grandParentHeir.name})`;
                        } else if (grandParentHeir === null && parentRelationship === 'CHILD'){ 
                            displayRelationshipText = `Unuk/a (od ${parentName})`;
                        } else { 
                             displayRelationshipText = `Potomak (od ${parentName})`; // Fallback for deeper descendants
                        }
                    } else if (parentRelationship === 'PARENT') {
                        displayRelationshipText = `Brat/Sestra (od ${parentName})`;
                    } else if (parentRelationship.includes('GRANDFATHER') || parentRelationship.includes('GRANDMOTHER')) {
                        displayRelationshipText = `Ujak/Stric/Tetka (potomak od ${parentName})`;
                    } else if (parentRelationship.startsWith('PGF_') || parentRelationship.startsWith('PGM_') || parentRelationship.startsWith('MGF_') || parentRelationship.startsWith('MGM_')) {
                        displayRelationshipText = `Potomak pradjeda/babe (od ${parentName})`;
                    } else {
                        displayRelationshipText = `Potomak (od ${parentName})`;
                    }
                } else {
                    displayRelationshipText = "Potomak"; 
                }
              }


              return (
                <TableRow key={heir.id} className={`${!hasPositiveShare && heir.isAlive && !heir.acceptsInheritance ? "text-muted-foreground opacity-60" : ""} hover:bg-secondary/30 print:break-inside-avoid`}>
                  <TableCell className={`font-medium ${!hasPositiveShare && !(!heir.isAlive && (heir.descendants || []).some(d=>results[d.id]?.numerator > 0)) ? 'text-muted-foreground' : ''} print:p-1 py-2`}>
                     {item.displayLevel > 0 && (
                          <span style={{ paddingLeft: `${item.displayLevel * 0.75}rem` }} className="inline-flex items-center">
                               <CornerDownRight className="mr-1 h-3 w-3 text-muted-foreground print:hidden" />
                               <span className={!hasPositiveShare ? '' : 'font-semibold'}>{heir.name}</span>
                           </span>
                     )}
                     {item.displayLevel === 0 && <span className={!hasPositiveShare ? '' : 'font-semibold'}>{heir.name}</span>}
                  </TableCell>
                  <TableCell className="print:hidden md:table-cell py-2">
                     {statusIcons}
                  </TableCell>
                   <TableCell className={`${!hasPositiveShare && !(!heir.isAlive && (heir.descendants || []).some(d=>results[d.id]?.numerator > 0)) ? 'text-muted-foreground opacity-80' : ''} print:p-1 py-2`}>
                       {displayRelationshipText}
                   </TableCell>
                  <TableCell className={`text-right font-semibold flex items-center justify-end ${hasPositiveShare ? 'text-accent print:text-black' : 'text-muted-foreground'} print:p-1 py-2`}>
                     <span className="tabular-nums">{formatFraction(share)}</span>
                     {hasPositiveShare && <Divide className="ml-1 h-4 w-4 opacity-60 print:hidden" />}
                  </TableCell>
                  {heirTaxes && (
                    <TableCell className={`text-right tabular-nums ${hasPositiveShare ? 'text-accent print:text-black' : 'text-muted-foreground'} print:p-1 py-2`}>
                      {typeof taxAmount === 'number' ? taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : (hasPositiveShare ? '0.00' : '-')}
                    </TableCell>
                  )}
                </TableRow>
              );
            }) : (
                 <TableRow>
                    <TableCell colSpan={heirTaxes ? 5 : 4} className="text-center text-muted-foreground py-4 print:p-1">
                         {potentialHeirsExist
                            ? "Niko od navedenih nema pravo na nasljedstvo ili se niko nije prihvatio nasljedstva."
                            : "Nema unesenih nasljednika."}
                         {!anyInheritors && potentialHeirsExist && " Imovina može pripasti Republici Srpskoj."}
                    </TableCell>
                 </TableRow>
            )}
          </TableBody>
        </Table>

        {donationRules.length > 0 && (
            <div className="mt-6 p-4 border-t border-dashed print:mt-4 print:break-before-page">
                <h4 className="text-md font-semibold mb-2 flex items-center text-primary print:text-base print:mb-1"><ArrowRightLeft className="mr-2 h-4 w-4 print:hidden"/> Prikaz Ustupanja Dijelova</h4>
                <ul className="space-y-1.5 text-sm list-none print:text-xs">
                    {donationRules.map(rule => {
                         const donorName = allHeirsMap.get(rule.donorId)?.name || 'Nepoznat';
                         const recipientName = allHeirsMap.get(rule.recipientId)?.name || 'Nepoznat';
                         return (
                            <li key={rule.id} className="print:break-inside-avoid flex items-center gap-1 text-muted-foreground">
                                <span className="font-medium text-foreground">{donorName}</span>
                                <ArrowRightLeft className="h-3 w-3 text-muted-foreground flex-shrink-0"/>
                                <span className="font-medium text-foreground">{recipientName}</span>
                                <span className="ml-1">({formatFraction(rule.portionOfShare)} <span className="italic text-xs">donatorovog dijela</span>)</span>
                            </li>
                         );
                    })}
                </ul>
            </div>
        )}

        <div className="mt-4 px-4 pb-4 print:mt-4 print:p-0 print:max-w-full">
            <p className="text-sm text-muted-foreground text-center italic print:text-xs">
                Ovaj programčić je u testnoj fazi te pruža samo indikativne rezultate nasljeđivanja i ni na koji način ne garantuje tačnost dobijenih podataka. Takođe, on nije namijenjen za složene situacije, nema pojma šta je nužni dio ili šta je nedostojnost nasljeđivanja i sl.
            </p>
        </div>
         
      </CardContent>
    </Card>
  );
}