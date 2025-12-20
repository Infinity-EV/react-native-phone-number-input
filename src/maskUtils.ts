import type { CountryCode } from "./countryPickerModal";

/**
 * Phone number mask patterns for different countries
 * '#' represents a digit placeholder
 * Other characters are literals that will appear in the formatted output
 */
export const MASK_PATTERNS: Record<string, string> = {
    // North America
    US: "(###) ###-####", // United States: (123) 456-7890
    CA: "(###) ###-####", // Canada: (123) 456-7890

    // Asia-Pacific
    VN: "### ### ####", // Vietnam: 012 345 6789
    AU: "#### ### ###", // Australia: 0412 345 678
    JP: "###-####-####", // Japan: 090-1234-5678
    CN: "### #### ####", // China: 138 0013 8000
    IN: "##### #####", // India: 98765 43210
    SG: "#### ####", // Singapore: 9123 4567
    KR: "###-####-####", // South Korea: 010-1234-5678
    TH: "###-###-####", // Thailand: 081-234-5678

    // Europe
    GB: "##### ######", // United Kingdom: 07700 900123
    FR: "## ## ## ## ##", // France: 06 12 34 56 78
    DE: "#### ########", // Germany: 0151 12345678
    IT: "### ### ####", // Italy: 320 123 4567
    ES: "### ## ## ##", // Spain: 612 34 56 78
    NL: "## ########", // Netherlands: 06 12345678
    BE: "#### ## ## ##", // Belgium: 0470 12 34 56
    CH: "### ### ## ##", // Switzerland: 079 123 45 67

    // Middle East
    AE: "## ### ####", // UAE: 50 123 4567
    SA: "## ### ####", // Saudi Arabia: 50 123 4567

    // Latin America
    BR: "(##) #####-####", // Brazil: (11) 91234-5678
    MX: "### ### ####", // Mexico: 222 123 4567
    AR: "## ####-####", // Argentina: 11 1234-5678

    // Africa
    ZA: "### ### ####", // South Africa: 082 123 4567
    NG: "### ### ####", // Nigeria: 080 123 4567

    // Generic fallback for countries not listed
    DEFAULT: "### ### ### ###"
};

/**
 * Get the mask pattern for a specific country code
 * @param countryCode - The ISO 3166-1 alpha-2 country code
 * @returns The mask pattern string for the country
 */
export function getMaskForCountry(countryCode: CountryCode): string {
    const pattern = MASK_PATTERNS[countryCode];
    return pattern !== undefined ? pattern : (MASK_PATTERNS.DEFAULT as string);
}

/**
 * Remove all non-digit characters from a string
 * @param value - The string to clean
 * @returns String containing only digits
 */
export function removeMask(value: string): string {
    return value.replace(/\D/g, "");
}

/**
 * Apply a mask pattern to a phone number
 * @param value - The raw phone number (digits only or with formatting)
 * @param mask - The mask pattern to apply
 * @returns The formatted phone number with mask applied
 */
export function applyMask(value: string, mask: string): string {
    // Remove all non-digit characters from input
    const digits = removeMask(value);

    if (!digits) {
        return "";
    }

    let result = "";
    let digitIndex = 0;

    // Iterate through mask pattern
    for (let i = 0; i < mask.length && digitIndex < digits.length; i++) {
        if (mask[i] === "#") {
            // Replace '#' with actual digit
            result += digits[digitIndex];
            digitIndex++;
        } else {
            // Add literal character from mask
            result += mask[i];
        }
    }

    // If there are remaining digits that don't fit the mask, append them
    if (digitIndex < digits.length) {
        result += digits.slice(digitIndex);
    }

    return result;
}

/**
 * Calculate the cursor position after applying a mask
 * This ensures the cursor stays in the correct position when formatting is applied
 * @param previousValue - The value before masking
 * @param newValue - The value after masking
 * @param previousCursorPosition - The cursor position before masking
 * @returns The new cursor position
 */
export function getNewCursorPosition(previousValue: string, newValue: string, previousCursorPosition: number): number {
    // Count digits before cursor in previous value
    const digitsBefore = removeMask(previousValue.slice(0, previousCursorPosition)).length;

    // If no digits before cursor, return 0
    if (digitsBefore === 0) {
        return 0;
    }

    // Find position in new value where we have the same number of digits
    let digitsCount = 0;
    let newPosition = 0;

    for (let i = 0; i < newValue.length; i++) {
        const char = newValue[i];
        if (char && /\d/.test(char)) {
            digitsCount++;
        }
        if (digitsCount === digitsBefore) {
            // Place cursor after this digit
            newPosition = i + 1;
            break;
        }
    }

    // If we haven't found the position yet, place cursor at the end
    if (newPosition === 0 && newValue.length > 0) {
        newPosition = newValue.length;
    }

    return newPosition;
}

/**
 * Check if a character at a given position in the mask is a literal (not a digit placeholder)
 * @param mask - The mask pattern
 * @param position - The position to check
 * @returns True if the character is a literal, false if it's a digit placeholder
 */
export function isLiteralPosition(mask: string, position: number): boolean {
    return position < mask.length && mask[position] !== "#";
}

/**
 * Get the maximum number of digits allowed by a mask pattern
 * @param mask - The mask pattern
 * @returns The count of '#' characters in the mask
 */
export function getMaxDigits(mask: string): number {
    return (mask.match(/#/g) || []).length;
}
