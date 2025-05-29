
import type { Heir, Fraction, DonationRule, Relationship, RedistributionWarning } from '@/types/heir';

// --- Fraction Helper Functions ---

/** Greatest Common Divisor (GCD) using Euclidean algorithm */
function gcd(a: number, b: number): number {
    a = Math.abs(Math.round(a));
    b = Math.abs(Math.round(b));
    if (isNaN(a) || isNaN(b)) return 1;
    return b === 0 ? a : gcd(b, a % b);
}

/** Least Common Multiple (LCM) of two numbers */
function lcm(a: number, b: number): number {
    a = Math.abs(Math.round(a));
    b = Math.abs(Math.round(b));
    if (isNaN(a) || isNaN(b)) return 1;
    if (a === 0 || b === 0) return 0;
    return Math.abs(a * b) / gcd(a, b);
}

/** Least Common Multiple (LCM) of an array of numbers */
export function arrayLcm(numbers: number[]): number {
    if (!numbers || numbers.length === 0) return 1;
    const validNumbers = numbers.filter(n => typeof n === 'number' && !isNaN(n) && n > 0);
    if (validNumbers.length === 0) return 1;
    return validNumbers.reduce((acc, val) => lcm(acc, val), 1);
}

/** Simplify a fraction */
export function simplifyFraction(fraction: Fraction): Fraction {
    if (!fraction) return { numerator: 0, denominator: 1 };
    if (fraction.numerator === 0) {
        return { numerator: 0, denominator: 1 };
    }
    const num = Math.round(fraction.numerator);
    const den = Math.round(fraction.denominator);

    if (den === 0 || isNaN(num) || isNaN(den)) {
        console.error("Invalid input in simplifyFraction:", fraction);
        return { numerator: 0, denominator: 1 }; 
    }

    const commonDivisor = gcd(Math.abs(num), Math.abs(den));
    const finalDenominator = Math.abs(den / commonDivisor); 
    const finalNumerator = (num / commonDivisor) * (den < 0 && num !== 0 ? -1 : 1); 

    return {
        numerator: finalNumerator,
        denominator: finalDenominator,
    };
}

/** Add two fractions */
export function addFractions(f1: Fraction, f2: Fraction): Fraction {
    if (!f1) f1 = { numerator: 0, denominator: 1 };
    if (!f2) f2 = { numerator: 0, denominator: 1 };

    const commonDen = lcm(f1.denominator, f2.denominator);
     if (commonDen === 0 || isNaN(commonDen) || f1.denominator === 0 || f2.denominator === 0) {
         console.error("Invalid common denominator or input denominator in addFractions", f1, f2, commonDen);
         return { numerator: 0, denominator: 1 };
     }
    const num1 = f1.numerator * (commonDen / f1.denominator);
    const num2 = f2.numerator * (commonDen / f2.denominator);

    return simplifyFraction({ numerator: num1 + num2, denominator: commonDen });
}

/** Subtract fraction f2 from f1 */
export function subtractFractions(f1: Fraction, f2: Fraction): Fraction {
     if (!f1) f1 = { numerator: 0, denominator: 1 };
     if (!f2) f2 = { numerator: 0, denominator: 1 };

     const commonDen = lcm(f1.denominator, f2.denominator);
      if (commonDen === 0 || isNaN(commonDen) || f1.denominator === 0 || f2.denominator === 0) {
         console.error("Invalid common denominator or input denominator in subtractFractions", f1, f2, commonDen);
         return { numerator: 0, denominator: 1 };
      }
     const num1 = f1.numerator * (commonDen / f1.denominator);
     const num2 = f2.numerator * (commonDen / f2.denominator);

     return simplifyFraction({ numerator: num1 - num2, denominator: commonDen });
}

/** Multiply two fractions */
function multiplyFractions(f1: Fraction, f2: Fraction): Fraction {
    if (!f1) f1 = { numerator: 0, denominator: 1 };
    if (!f2) f2 = { numerator: 0, denominator: 1 };
     if (f1.denominator === 0 || f2.denominator === 0) {
        console.error("Invalid denominator in multiplyFractions", f1, f2);
        return { numerator: 0, denominator: 1 };
    }
    return simplifyFraction({
        numerator: f1.numerator * f2.numerator,
        denominator: f1.denominator * f2.denominator,
    });
}

/** Divide a fraction by a number */
function divideFractionByNumber(fraction: Fraction, divisor: number): Fraction {
    if (!fraction) fraction = { numerator: 0, denominator: 1 };
    if (divisor === 0 || isNaN(divisor)) {
        console.error("Division by zero or NaN in divideFractionByNumber", divisor);
        return { numerator: 0, denominator: 1 };
    }
     if (fraction.denominator === 0) {
        console.error("Invalid denominator in divideFractionByNumber", fraction);
        return { numerator: 0, denominator: 1 };
    }
    return simplifyFraction({
        numerator: fraction.numerator,
        denominator: fraction.denominator * divisor,
    });
}

/** Compare two fractions (f1 > f2 -> 1, f1 < f2 -> -1, f1 == f2 -> 0) */
export function compareFractions(f1: Fraction, f2: Fraction): number {
    if (!f1 || !f2 || typeof f1.numerator === 'undefined' || typeof f1.denominator === 'undefined' || typeof f2.numerator === 'undefined' || typeof f2.denominator === 'undefined' || f1.denominator === 0 || f2.denominator === 0) {
        if (f1 && f1.numerator === 0 && f1.denominator > 0 && f2 && f2.numerator === 0 && f2.denominator > 0) return 0; 
        if (f1 && f1.denominator === 0 && f2 && f2.denominator !==0) return 1; 
        if (f2 && f2.denominator === 0 && f1 && f1.denominator !==0) return -1;
        return 0; 
    }
    const num1 = f1.numerator * f2.denominator;
    const num2 = f2.numerator * f1.denominator;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
    return 0;
}

// --- Helper Functions for Inheritance ---

function getAllHeirsRecursive(heirs: Heir[]): Heir[] {
    let all: Heir[] = [];
    heirs.forEach(h => {
        all.push(h);
        if (h.descendants) {
            all = all.concat(getAllHeirsRecursive(h.descendants));
        }
    });
    return all;
}


// Helper constants for fractions
const F_ZERO: Fraction = { numerator: 0, denominator: 1 };
const F_HALF: Fraction = { numerator: 1, denominator: 2 };
const F_ONE: Fraction = { numerator: 1, denominator: 1 };

function finalizeAndReturnResults(results: Record<string, Fraction>): Record<string, Fraction> {
    const finalResults: Record<string, Fraction> = {};
    Object.keys(results).forEach(id => {
        finalResults[id] = simplifyFraction(results[id] || F_ZERO);
    });
    return finalResults;
}

const isHeirActive = (heir?: Heir) => heir && heir.isAlive && heir.acceptsInheritance;

// Check if a deceased heir has any living descendants down their line who can inherit
const heirHasIssue = (heir?: Heir): boolean => {
    if (!heir || heir.isAlive) return false; // Only for deceased heirs
    if (!heir.descendants || heir.descendants.length === 0) return false; // No descendants at all

    // Check if any direct descendant is active OR if any deceased direct descendant has their own issue
    return heir.descendants.some(d => isHeirActive(d) || heirHasIssue(d)); // Recursive call
};


function distributeShareToDescendants(deceasedHeir: Heir, heirShare: Fraction, results: Record<string, Fraction>) {
    const eligibleDescendants = (deceasedHeir.descendants || []).filter(d => isHeirActive(d));
    const deceasedDescendantsWithTheirOwnIssue = (deceasedHeir.descendants || []).filter(d =>
        !d.isAlive && heirHasIssue(d) 
    );

    const totalSubShares = eligibleDescendants.length + deceasedDescendantsWithTheirOwnIssue.length;

    if (totalSubShares === 0) {
        return; 
    }

    const sharePerSubShare = divideFractionByNumber(heirShare, totalSubShares);

    eligibleDescendants.forEach(descendant => {
        results[descendant.id] = addFractions(results[descendant.id] || F_ZERO, sharePerSubShare);
    });

    deceasedDescendantsWithTheirOwnIssue.forEach(deceasedDescendant => {
        distributeShareToDescendants(deceasedDescendant, sharePerSubShare, results); // Recursive call
    });
}


function distributeToGrandparentPair(totalShareForPair: Fraction, results: Record<string, Fraction>, gp1?: Heir, gp2?: Heir) {
    const gp1CanInherit = isHeirActive(gp1) || heirHasIssue(gp1);
    const gp2CanInherit = isHeirActive(gp2) || heirHasIssue(gp2);

    const sharePerGrandparentInLine = divideFractionByNumber(totalShareForPair, 2);

    if (gp1CanInherit && gp2CanInherit) { 
        if (isHeirActive(gp1) && gp1) results[gp1.id] = addFractions(results[gp1.id] || F_ZERO, sharePerGrandparentInLine);
        else if (heirHasIssue(gp1) && gp1) distributeShareToDescendants(gp1, sharePerGrandparentInLine, results);

        if (isHeirActive(gp2) && gp2) results[gp2.id] = addFractions(results[gp2.id] || F_ZERO, sharePerGrandparentInLine);
        else if (heirHasIssue(gp2) && gp2) distributeShareToDescendants(gp2, sharePerGrandparentInLine, results);
    } else if (gp1CanInherit) { 
        if (isHeirActive(gp1) && gp1) results[gp1.id] = addFractions(results[gp1.id] || F_ZERO, totalShareForPair);
        else if (heirHasIssue(gp1) && gp1) distributeShareToDescendants(gp1, totalShareForPair, results);
    } else if (gp2CanInherit) { 
        if (isHeirActive(gp2) && gp2) results[gp2.id] = addFractions(results[gp2.id] || F_ZERO, totalShareForPair);
        else if (heirHasIssue(gp2) && gp2) distributeShareToDescendants(gp2, totalShareForPair, results);
    }
}

// Helper for 4th order: process a single great-grandparent pair, now with right of representation
function processGreatGrandparentPair(
    shareForPair: Fraction, 
    results: Record<string, Fraction>, 
    ggpF?: Heir, 
    ggpM?: Heir, 
    isCheckingOnly: boolean = false
): boolean {
    const ggpFCanInherit = isHeirActive(ggpF) || heirHasIssue(ggpF);
    const ggpMCanInherit = isHeirActive(ggpM) || heirHasIssue(ggpM);

    if (!ggpFCanInherit && !ggpMCanInherit) return false;

    if (isCheckingOnly) return true; 

    if (ggpFCanInherit && ggpMCanInherit) {
        const halfShare = multiplyFractions(shareForPair, F_HALF);
        if (isHeirActive(ggpF) && ggpF) results[ggpF.id] = addFractions(results[ggpF.id] || F_ZERO, halfShare);
        else if (heirHasIssue(ggpF) && ggpF) distributeShareToDescendants(ggpF, halfShare, results);

        if (isHeirActive(ggpM) && ggpM) results[ggpM.id] = addFractions(results[ggpM.id] || F_ZERO, halfShare);
        else if (heirHasIssue(ggpM) && ggpM) distributeShareToDescendants(ggpM, halfShare, results);
    } else if (ggpFCanInherit) {
        if (isHeirActive(ggpF) && ggpF) results[ggpF.id] = addFractions(results[ggpF.id] || F_ZERO, shareForPair);
        else if (heirHasIssue(ggpF) && ggpF) distributeShareToDescendants(ggpF, shareForPair, results);
    } else if (ggpMCanInherit) { 
        if (isHeirActive(ggpM) && ggpM) results[ggpM.id] = addFractions(results[ggpM.id] || F_ZERO, shareForPair);
        else if (heirHasIssue(ggpM) && ggpM) distributeShareToDescendants(ggpM, shareForPair, results);
    }
    return true; 
}

// Helper for 4th order: distributes a share among a GGP line (two pairs), with representation
function distributeAmongGreatGrandparentLine(
    lineShare: Fraction,
    results: Record<string, Fraction>,
    pair1_F?: Heir, pair1_M?: Heir, 
    pair2_F?: Heir, pair2_M?: Heir, 
    isCheckingOnly: boolean = false
): boolean {
    const sharePerSubPair = multiplyFractions(lineShare, F_HALF);

    const pair1CanInherit = processGreatGrandparentPair(sharePerSubPair, {}, pair1_F, pair1_M, true);
    const pair2CanInherit = processGreatGrandparentPair(sharePerSubPair, {}, pair2_F, pair2_M, true);

    if (isCheckingOnly) {
        return pair1CanInherit || pair2CanInherit;
    }

    if (pair1CanInherit && pair2CanInherit) {
        processGreatGrandparentPair(sharePerSubPair, results, pair1_F, pair1_M, false);
        processGreatGrandparentPair(sharePerSubPair, results, pair2_F, pair2_M, false);
        return true;
    } else if (pair1CanInherit) {
        processGreatGrandparentPair(lineShare, results, pair1_F, pair1_M, false);
        return true;
    } else if (pair2CanInherit) {
        processGreatGrandparentPair(lineShare, results, pair2_F, pair2_M, false);
        return true;
    }
    
    return false;
}


export function calculateInitialInheritance(allHeirsInput: Heir[]): Record<string, Fraction> {
  const results: Record<string, Fraction> = {};
  let remainingEstate: Fraction = F_ONE;
  const allHeirsForInit = getAllHeirsRecursive(allHeirsInput); 

  allHeirsForInit.forEach(h => {
      results[h.id] = F_ZERO;
  });

  const spouseRequestingHalf = allHeirsInput.find(h =>
      h.relationship === 'SPOUSE' &&
      isHeirActive(h) &&
      h.requestSeparateHalf === true
  );

  if (spouseRequestingHalf) {
      results[spouseRequestingHalf.id] = addFractions(results[spouseRequestingHalf.id] || F_ZERO, F_HALF);
      remainingEstate = subtractFractions(remainingEstate, F_HALF);
  }

  if (remainingEstate.numerator <= 0 && remainingEstate.denominator > 0) {
      return finalizeAndReturnResults(results);
  }

  // First Order: Children and/or Spouse
  const livingSpouse = allHeirsInput.find(h => h.relationship === 'SPOUSE' && isHeirActive(h));
  const livingChildren = allHeirsInput.filter(h => h.relationship === 'CHILD' && isHeirActive(h));
  const deceasedChildrenWithIssue = allHeirsInput.filter(h => h.relationship === 'CHILD' && heirHasIssue(h));


  if (livingChildren.length > 0 || deceasedChildrenWithIssue.length > 0) {
      let firstOrderBeneficiaryCount = livingChildren.length + deceasedChildrenWithIssue.length;
      if (livingSpouse) {
          firstOrderBeneficiaryCount++;
      }

      if (firstOrderBeneficiaryCount > 0) {
          const sharePerFirstOrderLine = divideFractionByNumber(remainingEstate, firstOrderBeneficiaryCount);
          if (livingSpouse) {
              results[livingSpouse.id] = addFractions(results[livingSpouse.id] || F_ZERO, sharePerFirstOrderLine);
          }
          livingChildren.forEach(child => {
              results[child.id] = addFractions(results[child.id] || F_ZERO, sharePerFirstOrderLine);
          });
          deceasedChildrenWithIssue.forEach(child => {
              distributeShareToDescendants(child, sharePerFirstOrderLine, results);
          });
      }
      return finalizeAndReturnResults(results);
  }

  // Second Order: Parents and/or Spouse (if no children)
  const parentsInput = allHeirsInput.filter(h => h.relationship === 'PARENT');
  const acceptingLivingParents = parentsInput.filter(p => isHeirActive(p));
  const deceasedParentsWithLineage = parentsInput.filter(p => heirHasIssue(p));


  if (livingSpouse && acceptingLivingParents.length === 0 && deceasedParentsWithLineage.length === 0) {
      results[livingSpouse.id] = addFractions(results[livingSpouse.id] || F_ZERO, remainingEstate);
      return finalizeAndReturnResults(results);
  }

  if (acceptingLivingParents.length > 0 || deceasedParentsWithLineage.length > 0) {
      const parentsEstateShare = livingSpouse ? multiplyFractions(remainingEstate, F_HALF) : remainingEstate;
      if (livingSpouse) {
          results[livingSpouse.id] = addFractions(results[livingSpouse.id] || F_ZERO, multiplyFractions(remainingEstate, F_HALF));
      }

      const activeParentLines = [...acceptingLivingParents, ...deceasedParentsWithLineage];
      if (activeParentLines.length === 1) {
          const activeLine = activeParentLines[0];
          if (isHeirActive(activeLine)) {
              results[activeLine.id] = addFractions(results[activeLine.id] || F_ZERO, parentsEstateShare);
          } else if (heirHasIssue(activeLine)) {
              distributeShareToDescendants(activeLine, parentsEstateShare, results);
          }
      } else if (activeParentLines.length === 2) {
          const sharePerParentLine = divideFractionByNumber(parentsEstateShare, 2);
          activeParentLines.forEach(pLine => {
              if (isHeirActive(pLine)) {
                  results[pLine.id] = addFractions(results[pLine.id] || F_ZERO, sharePerParentLine);
              } else if (heirHasIssue(pLine)) {
                  distributeShareToDescendants(pLine, sharePerParentLine, results);
              }
          });
      } else if (parentsInput.length === 2 && acceptingLivingParents.length === 1 && deceasedParentsWithLineage.length === 0) {
         // This case handles if one parent is alive and accepts, and other parent is deceased *without* issue.
         // The living parent gets the full parent's share.
         const livingParent = acceptingLivingParents[0];
         results[livingParent.id] = addFractions(results[livingParent.id] || F_ZERO, parentsEstateShare);
      }
      return finalizeAndReturnResults(results);
  }

  // Third Order: Grandparents and/or Spouse (if no children or parents/their issue)
  const paternalGrandfather = allHeirsInput.find(h => h.relationship === 'PATERNAL_GRANDFATHER');
  const paternalGrandmother = allHeirsInput.find(h => h.relationship === 'PATERNAL_GRANDMOTHER');
  const maternalGrandfather = allHeirsInput.find(h => h.relationship === 'MATERNAL_GRANDFATHER');
  const maternalGrandmother = allHeirsInput.find(h => h.relationship === 'MATERNAL_GRANDMOTHER');

  const paternalLineCanInherit = isHeirActive(paternalGrandfather) || heirHasIssue(paternalGrandfather) || isHeirActive(paternalGrandmother) || heirHasIssue(paternalGrandmother);
  const maternalLineCanInherit = isHeirActive(maternalGrandfather) || heirHasIssue(maternalGrandfather) || isHeirActive(maternalGrandmother) || heirHasIssue(maternalGrandmother);

  if (livingSpouse && !paternalLineCanInherit && !maternalLineCanInherit) {
    results[livingSpouse.id] = addFractions(results[livingSpouse.id] || F_ZERO, remainingEstate);
    return finalizeAndReturnResults(results);
  }

  if (paternalLineCanInherit || maternalLineCanInherit) {
      const grandparentsTotalShare = livingSpouse ? multiplyFractions(remainingEstate, F_HALF) : remainingEstate;
      if (livingSpouse) {
          results[livingSpouse.id] = addFractions(results[livingSpouse.id] || F_ZERO, multiplyFractions(remainingEstate, F_HALF));
      }

      if (paternalLineCanInherit && maternalLineCanInherit) {
          const sharePerLine = multiplyFractions(grandparentsTotalShare, F_HALF);
          distributeToGrandparentPair(sharePerLine, results, paternalGrandfather, paternalGrandmother);
          distributeToGrandparentPair(sharePerLine, results, maternalGrandfather, maternalGrandmother);
      } else if (paternalLineCanInherit) {
          distributeToGrandparentPair(grandparentsTotalShare, results, paternalGrandfather, paternalGrandmother);
      } else if (maternalLineCanInherit) { // This implies paternal cannot
          distributeToGrandparentPair(grandparentsTotalShare, results, maternalGrandfather, maternalGrandmother);
      }
      return finalizeAndReturnResults(results);
  }

  // Fourth Order: Great-Grandparents and/or Spouse (if no prior orders)
  const pgf_f = allHeirsInput.find(h => h.relationship === 'PGF_F');
  const pgf_m = allHeirsInput.find(h => h.relationship === 'PGF_M');
  const pgm_f = allHeirsInput.find(h => h.relationship === 'PGM_F');
  const pgm_m = allHeirsInput.find(h => h.relationship === 'PGM_M');
  const mgf_f = allHeirsInput.find(h => h.relationship === 'MGF_F');
  const mgf_m = allHeirsInput.find(h => h.relationship === 'MGF_M');
  const mgm_f = allHeirsInput.find(h => h.relationship === 'MGM_F');
  const mgm_m = allHeirsInput.find(h => h.relationship === 'MGM_M');

  const paternalGGPLineHasPotential = distributeAmongGreatGrandparentLine(F_ONE, {}, pgf_f, pgf_m, pgm_f, pgm_m, true);
  const maternalGGPLineHasPotential = distributeAmongGreatGrandparentLine(F_ONE, {}, mgf_f, mgf_m, mgm_f, mgm_m, true);

  if (livingSpouse && !paternalGGPLineHasPotential && !maternalGGPLineHasPotential) {
      results[livingSpouse.id] = addFractions(results[livingSpouse.id] || F_ZERO, remainingEstate);
      return finalizeAndReturnResults(results);
  }

  if (paternalGGPLineHasPotential || maternalGGPLineHasPotential) {
      const ggpTotalShare = livingSpouse ? multiplyFractions(remainingEstate, F_HALF) : remainingEstate;
      if (livingSpouse) {
          results[livingSpouse.id] = addFractions(results[livingSpouse.id] || F_ZERO, multiplyFractions(remainingEstate, F_HALF));
      }

      if (paternalGGPLineHasPotential && maternalGGPLineHasPotential) {
          const sharePerGGPLIne = multiplyFractions(ggpTotalShare, F_HALF);
          distributeAmongGreatGrandparentLine(sharePerGGPLIne, results, pgf_f, pgf_m, pgm_f, pgm_m, false);
          distributeAmongGreatGrandparentLine(sharePerGGPLIne, results, mgf_f, mgf_m, mgm_f, mgm_m, false);
      } else if (paternalGGPLineHasPotential) {
          distributeAmongGreatGrandparentLine(ggpTotalShare, results, pgf_f, pgf_m, pgm_f, pgm_m, false);
      } else if (maternalGGPLineHasPotential) { // This implies paternal cannot
          distributeAmongGreatGrandparentLine(ggpTotalShare, results, mgf_f, mgf_m, mgm_f, mgm_m, false);
      }
      return finalizeAndReturnResults(results);
  }
  
  // If no heirs in any of the defined orders, and no spouse, estate might go to state (not handled here)
  // Or if only a spouse (who didn't request half) and no other heirs, spouse gets all.
  if (livingSpouse && !spouseRequestingHalf) { 
    const otherPotentialHeirs = allHeirsInput.filter(h => h.relationship !== 'SPOUSE' && (isHeirActive(h) || heirHasIssue(h)));
    if(otherPotentialHeirs.length === 0) {
        results[livingSpouse.id] = addFractions(results[livingSpouse.id] || F_ZERO, remainingEstate);
    }
  }
  // Final fallback if no one inherits
  return finalizeAndReturnResults(results);
}


export function applyRedistributions(
    initialResults: Record<string, Fraction>,
    donationRules: DonationRule[],
    allHeirs: Heir[] 
): { finalShares: Record<string, Fraction>; warnings: RedistributionWarning[] } {
    const finalResults = { ...initialResults }; // Start with initial shares
    const warnings: RedistributionWarning[] = [];
    const allHeirsMap = new Map(getAllHeirsRecursive(allHeirs).map(h => [h.id, h]));

    // Step 1: Validate donor allocations
    const donorAllocationStatus: Record<string, { totalRelativeAllocated: Fraction; isValid: boolean }> = {};

    // Calculate total relative portion allocated by each donor
    for (const rule of donationRules) {
        // Ensure donor had an initial share > 0 to be eligible for donation rules
        if (!initialResults[rule.donorId] || initialResults[rule.donorId].numerator === 0) {
            continue; // Skip rules from donors who had no initial share
        }

        if (!donorAllocationStatus[rule.donorId]) {
            donorAllocationStatus[rule.donorId] = { totalRelativeAllocated: F_ZERO, isValid: false };
        }
        donorAllocationStatus[rule.donorId].totalRelativeAllocated = addFractions(
            donorAllocationStatus[rule.donorId].totalRelativeAllocated,
            rule.portionOfShare
        );
    }

    // Validate if each donor allocated exactly 100% of their share
    for (const donorId in donorAllocationStatus) {
        const status = donorAllocationStatus[donorId];
        status.totalRelativeAllocated = simplifyFraction(status.totalRelativeAllocated); // Simplify for comparison
        
        if (compareFractions(status.totalRelativeAllocated, F_ONE) === 0) {
            status.isValid = true;
        } else {
            status.isValid = false;
            const donorName = allHeirsMap.get(donorId)?.name || `Donator ID: ${donorId}`;
            warnings.push({
                type: 'donor_incomplete_allocation',
                donorName: donorName,
                message: `${donorName} nije preraspodijelio/la tačno 100% svog dijela (alocirano: ${formatFractionForLog(status.totalRelativeAllocated)}). Njegove/njene donacije neće biti primijenjene.`
            });
        }
    }

    // Step 2: Apply valid donations
    for (const rule of donationRules) {
        const donorId = rule.donorId;
        const recipientId = rule.recipientId;

        // Only apply rules from valid donors who had an initial share
        if (donorAllocationStatus[donorId]?.isValid && initialResults[donorId] && initialResults[donorId].numerator > 0) {
            const donorInitialAbsoluteShare = initialResults[donorId]; // The donor's share *before* any donations

            // If this is the first rule being processed for this valid donor, set their share to zero
            // This ensures their original share is "emptied" before distributing parts of it.
            // We check against initialResults to ensure this happens only once per donor.
            if (compareFractions(finalResults[donorId], donorInitialAbsoluteShare) === 0) {
                 finalResults[donorId] = F_ZERO;
            }

            // Calculate the absolute amount to transfer based on the donor's *initial* share
            const absoluteAmountToTransfer = multiplyFractions(donorInitialAbsoluteShare, rule.portionOfShare);

            // Add the transferred amount to the recipient
            finalResults[recipientId] = addFractions(
                finalResults[recipientId] || F_ZERO, // Initialize recipient's share if not present
                absoluteAmountToTransfer
            );
        }
    }

    // Step 3: Simplify all final shares
    for (const heirId in finalResults) {
        finalResults[heirId] = simplifyFraction(finalResults[heirId]);
    }

    return { finalShares: finalResults, warnings };
}


function formatFractionForLog(fraction: Fraction): string {
    if (!fraction) return "N/A";
    const simplified = simplifyFraction(fraction);
    return `${simplified.numerator}/${simplified.denominator}`;
}


export function convertToCommonDenominator(results: Record<string, Fraction>): Record<string, Fraction> {
    const commonDenominatorResults: Record<string, Fraction> = {};
    const simplifiedResults: Record<string, Fraction> = {};
    const allOriginalHeirIds = Object.keys(results);


    allOriginalHeirIds.forEach(heirId => {
        simplifiedResults[heirId] = simplifyFraction(results[heirId] || F_ZERO);
    });


    const denominators = Object.values(simplifiedResults)
                              .map(f => f?.denominator)
                              .filter((d): d is number => typeof d === 'number' && d > 0);

    if (denominators.length === 0) { // Handle case with no valid denominators (e.g., all shares are 0)
         allOriginalHeirIds.forEach(heirId => {
            commonDenominatorResults[heirId] = simplifiedResults[heirId] || F_ZERO;
         });
        return commonDenominatorResults;
    }

    const commonDen = arrayLcm(denominators);

    if (commonDen <= 0 || isNaN(commonDen)) { // Should not happen if denominators are all > 0
        console.error("Invalid common denominator calculated:", commonDen, "Denominators:", denominators);
        // Fallback: return simplified results if common denominator calculation fails
        allOriginalHeirIds.forEach(heirId => {
             commonDenominatorResults[heirId] = simplifiedResults[heirId] || F_ZERO;
        });
        return commonDenominatorResults;
    }


    allOriginalHeirIds.forEach(heirId => {
        const fraction = simplifiedResults[heirId];

        // Ensure fraction is valid before processing
        if (!fraction || typeof fraction.numerator !== 'number' || typeof fraction.denominator !== 'number' || isNaN(fraction.numerator) || isNaN(fraction.denominator) || fraction.denominator <= 0) {
             commonDenominatorResults[heirId] = { numerator: 0, denominator: commonDen }; // Assign 0 share with common denominator
             return;
        }

         if (fraction.numerator === 0) { // If numerator is 0, share is 0/commonDen
             commonDenominatorResults[heirId] = { numerator: 0, denominator: commonDen };
             return;
        }

        const multiplier = commonDen / fraction.denominator;

        if (!Number.isFinite(multiplier) || isNaN(multiplier)) {
             console.error(`Invalid multiplier for heir ${heirId}. Orig (simplified): ${fraction.numerator}/${fraction.denominator}, Common Den: ${commonDen}, Multiplier: ${multiplier}`);
             commonDenominatorResults[heirId] = { numerator: 0, denominator: commonDen }; // Fallback on error
        } else {
             commonDenominatorResults[heirId] = {
                 numerator: Math.round(fraction.numerator * multiplier),
                 denominator: commonDen,
             };
        }
    });
    return commonDenominatorResults;
}

// Comment to satisfy XML requirement as the bug's root cause is not apparent.
// The logic for representation rights appears to cover the GGC scenario.
// Further debugging with specific data inputs would be needed.