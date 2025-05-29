
export type Relationship =
  | 'SPOUSE'
  | 'CHILD'
  | 'PARENT'
  // Grandparents
  | 'PATERNAL_GRANDFATHER' // Deceased's Father's Father
  | 'PATERNAL_GRANDMOTHER' // Deceased's Father's Mother
  | 'MATERNAL_GRANDFATHER' // Deceased's Mother's Father
  | 'MATERNAL_GRANDMOTHER' // Deceased's Mother's Mother
  // Great-Grandparents (Paternal Line)
  | 'PGF_F' // Paternal Grandfather's Father (Father's Father's Father)
  | 'PGF_M' // Paternal Grandfather's Mother (Father's Father's Mother)
  | 'PGM_F' // Paternal Grandmother's Father (Father's Mother's Father)
  | 'PGM_M' // Paternal Grandmother's Mother (Father's Mother's Mother)
  // Great-Grandparents (Maternal Line)
  | 'MGF_F' // Maternal Grandfather's Father (Mother's Father's Father)
  | 'MGF_M' // Maternal Grandfather's Mother (Mother's Father's Mother)
  | 'MGM_F' // Maternal Grandmother's Father (Mother's Mother's Father)
  | 'MGM_M'; // Maternal Grandmother's Mother (Mother's Mother's Mother)


export interface Heir {
  id: string; // Unique identifier for each heir
  name: string;
  relationship: Relationship;
  isAlive: boolean;
  acceptsInheritance: boolean;
  requestSeparateHalf?: boolean; // Optional: For spouse requesting their separate half
  descendants?: Heir[]; // Array to hold descendants if this heir is deceased
}

// Represents a fraction with numerator and denominator
export interface Fraction {
    numerator: number;
    denominator: number;
}

// Represents a rule for redistributing a portion of an heir's share
export interface DonationRule {
    id: string; // Unique ID for the rule
    donorId: string; // ID of the heir donating the share
    recipientId: string; // ID of the heir receiving the share
    portionOfShare: Fraction; // The fraction of the DONOR'S OWN INITIAL SHARE that is transferred to THIS RECIPIENT.
}

export interface RedistributionWarning {
    type: 'donor_incomplete_allocation';
    donorName: string;
    message: string;
}

