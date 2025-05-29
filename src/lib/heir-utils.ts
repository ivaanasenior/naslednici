import type { Heir } from '@/types/heir';

/**
 * Recursively flattens a list of heirs and their descendants into a single array.
 *
 * @param heirs The array of heirs (potentially nested) to flatten.
 * @returns A flat array containing all heirs and their descendants.
 */
export const flattenHeirs = (heirs: Heir[]): Heir[] => {
  let flatList: Heir[] = [];
  heirs.forEach(heir => {
    flatList.push(heir);
    if (heir.descendants) {
      flatList = flatList.concat(flattenHeirs(heir.descendants));
    }
  });
  return flatList;
};

/**
 * Recursively removes an heir by ID from a list of heirs and their descendants.
 * This version modifies the state directly or returns a new array for state update.
 *
 * @param heirs The array of heirs to process.
 * @param idToRemove The ID of the heir to remove.
 * @returns A new array with the specified heir (and their descendants) removed.
 */
export const removeHeirByIdRecursive = (heirs: Heir[], idToRemove: string): Heir[] => {
  return heirs
    .filter(heir => heir.id !== idToRemove) // Remove the heir at the current level
    .map(heir => {
      // If the current heir has descendants, recursively remove from them
      if (heir.descendants && heir.descendants.length > 0) {
        return {
          ...heir,
          descendants: removeHeirByIdRecursive(heir.descendants, idToRemove),
        };
      }
      // Otherwise, return the heir as is
      return heir;
    });
};


/**
 * Recursively adds a descendant heir to a specific parent heir within a nested structure.
 *
 * @param heirs The current list of top-level heirs.
 * @param parentId The ID of the parent heir to add the descendant to.
 * @param descendant The descendant heir object to add.
 * @returns A new array representing the updated heir structure.
 */
export const addDescendantToHeir = (heirs: Heir[], parentId: string, descendant: Heir): Heir[] => {
  return heirs.map(heir => {
    // Found the parent at the current level
    if (heir.id === parentId) {
      // Ensure acceptsInheritance is consistent with isAlive for the new descendant
      const finalDescendant = {
        ...descendant,
        acceptsInheritance: descendant.isAlive ? descendant.acceptsInheritance : false,
        // Ensure descendants have descendants array initialized
        descendants: descendant.descendants || [],
      };
      return {
        ...heir,
        // Ensure parent has descendants array initialized before adding
        descendants: [...(heir.descendants || []), finalDescendant],
      };
    }
    // Parent not found at this level, check descendants recursively
    if (heir.descendants && heir.descendants.length > 0) {
      return {
        ...heir,
        descendants: addDescendantToHeir(heir.descendants, parentId, descendant),
      };
    }
    // Not the parent and no descendants to check, return heir unchanged
    return heir;
  });
};
