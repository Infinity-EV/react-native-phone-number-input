import React, { ForwardRefExoticComponent, RefAttributes } from "react";
import { StyleProp, TextInputProps, TextStyle, ViewStyle } from "react-native";

export type {
    CallingCode,
    Country,
    CountryCode,
    CountryFilterProps,
    CountryPickerModalProps,
    Region,
    Subregion
} from "./src/countryPickerModal";

export interface PhoneInputProps {
    /** Enable dark theme styling */
    withDarkTheme?: boolean;

    /** Add shadow effect to the input container */
    withShadow?: boolean;

    /** Enable phone number masking with country-specific formatting patterns.
     * When enabled, the input will display formatted phone numbers (e.g., US: (123) 456-7890, VN: 012 345 6789).
     * The `onChangeText` callback will receive unformatted digits only,
     * while `onChangeFormattedText` will receive the masked value with country code.
     * @default false
     * @example
     * // With masking enabled
     * <PhoneInput withMask defaultCode="US" onChangeText={(text) => console.log(text)} />
     * // User types: 1234567890
     * // Display shows: (123) 456-7890
     * // onChangeText receives: "1234567890"
     * // onChangeFormattedText receives: "+11234567890"
     */
    withMask?: boolean;

    /** Automatically focus the input when component mounts */
    autoFocus?: boolean;

    /** Default country code (e.g., 'US', 'VN', 'GB').
     * This will be overridden if defaultCallingCode is provided.
     * @example
     * defaultCode="US" // Sets country to United States
     * @priority 2 (Lower priority than defaultCallingCode)
     */
    defaultCode?: CountryCode;

    /** Default calling code without '+' (e.g., '1' for US, '84' for VN).
     * This takes precedence over defaultCode if both are provided.
     * @example
     * defaultCallingCode="65" // Sets country to Singapore regardless of defaultCode
     * @priority 1 (Higher priority than defaultCode)
     *
     * // When both props are used:
     * defaultCode="US"
     * defaultCallingCode="65"
     * // Result: Singapore (+65) will be selected
     */
    defaultCallingCode?: string;

    /** Controlled input value */
    value?: string;

    /** Default value for uncontrolled input */
    defaultValue?: string;

    /** Disable the input field */
    disabled?: boolean;

    /** Hide the dropdown arrow icon */
    disableArrowIcon?: boolean;

    /** Placeholder text for the input field */
    placeholder?: string;

    /** Callback when selected country changes */
    onChangeCountry?: (country: Country) => void;

    /** Callback when input text changes */
    onChangeText?: (text: string) => void;

    /** Callback with formatted phone number including country code */
    onChangeFormattedText?: (text: string) => void;

    /** Callback when input loses focus */
    onBlur?: () => void;

    /** Callback when input gains focus */
    onFocus?: () => void;

    /** Custom dropdown arrow component */
    renderDropdownImage?: React.ReactNode;

    /** Style for the main container */
    containerStyle?: StyleProp<ViewStyle>;

    /** Style for the text input container */
    textContainerStyle?: StyleProp<ViewStyle>;

    /** Additional props for the text input */
    textInputProps?: TextInputProps;

    /** Style for the text input */
    textInputStyle?: StyleProp<TextStyle>;

    /** Style for the country calling code text */
    codeTextStyle?: StyleProp<TextStyle>;

    /** Style for the flag button */
    flagButtonStyle?: StyleProp<ViewStyle>;

    /** Style for the country picker button */
    countryPickerButtonStyle?: StyleProp<ViewStyle>;

    /** Layout type for the input:
     * 'first' - flag button first, then input
     * 'second' - input first, then flag button
     */
    layout?: "first" | "second";

    /** Props for the country filter functionality */
    filterProps?: CountryFilterProps;

    /** Props for the country picker modal */
    countryPickerProps?: CountryPickerModalProps;

    /** Size of the country flag */
    flagSize?: number;

    /** Show/hide country calling code */
    showCountryCode?: boolean;
}

export interface PhoneInputRefType {
    /** Get the current selected country code (e.g., 'US', 'GB', 'VN')
     * @returns CountryCode - The two-letter country code
     * @example
     * const countryCode = phoneInputRef.current?.getCountryCode();
     * console.log(countryCode); // 'US'
     */
    getCountryCode: () => CountryCode;

    /** Get the calling code of the current selected country without '+'
     * @returns CallingCode - The country calling code or undefined if not available
     * @example
     * const callingCode = phoneInputRef.current?.getCallingCode();
     * console.log(callingCode); // '1' for US, '84' for VN
     */
    getCallingCode: () => CallingCode | undefined;

    /** Check if the provided phone number is valid for the selected country
     * @param number - The phone number to validate
     * @returns boolean - True if the number is valid for the selected country
     * @example
     * const isValid = phoneInputRef.current?.isValidNumber('1234567890');
     * console.log(isValid); // true or false
     */
    isValidNumber: (number: string) => boolean;

    /** Get the phone number with possible leading zero elimination and its formatted version
     * @returns Object containing both raw and formatted numbers
     * @property {string} number - The raw phone number without formatting
     * @property {string} formattedNumber - The formatted phone number with country code
     * @example
     * const result = phoneInputRef.current?.getNumberAfterPossiblyEliminatingZero();
     * console.log(result);
     * // {
     * //   number: '1234567890',
     * //   formattedNumber: '+1 (123) 456-7890'
     * // }
     */
    getNumberAfterPossiblyEliminatingZero: () => {
        number: string | undefined;
        formattedNumber: string | undefined;
    };
}

declare const PhoneInput: ForwardRefExoticComponent<PhoneInputProps & RefAttributes<PhoneInputRefType>>;

export default PhoneInput;
