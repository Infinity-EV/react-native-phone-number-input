import { PhoneNumberUtil } from "google-libphonenumber";
import React from "react";
import {
    Image,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    type StyleProp,
    type TextInputProps,
    type TextStyle,
    type ViewStyle
} from "react-native";

import CountryPicker, {
    CountryModalProvider,
    DARK_THEME,
    DEFAULT_THEME,
    Flag,
    getCallingCode,
    loadDataAsync,
    type CallingCode,
    type Country,
    type CountryCode,
    type CountryFilterProps,
    type CountryPickerModalProps
} from "./countryPickerModal";
import styles from "./styles";

const dropDown =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAi0lEQVRYR+3WuQ6AIBRE0eHL1T83FBqU5S1szdiY2NyTKcCAzU/Y3AcBXIALcIF0gRPAsehgugDEXnYQrUC88RIgfpuJ+MRrgFmILN4CjEYU4xJgFKIa1wB6Ec24FuBFiHELwIpQxa0ALUId9wAkhCnuBdQQ5ngP4I9wxXsBDyJ9m+8y/g9wAS7ABW4giBshQZji3AAAAABJRU5ErkJggg==";
const phoneUtil = PhoneNumberUtil.getInstance();

export type PhoneInputProps = {
    withDarkTheme?: boolean;
    withShadow?: boolean;
    autoFocus?: boolean;
    defaultCode?: CountryCode;
    defaultCallingCode?: string;
    value?: string;
    defaultValue?: string;
    disabled?: boolean;
    disableArrowIcon?: boolean;
    placeholder?: string;
    onChangeCountry?: (country: Country) => void;
    onChangeText?: (text: string) => void;
    onChangeFormattedText?: (text: string) => void;
    onBlur?: () => void;
    onFocus?: () => void;
    renderDropdownImage?: React.ReactNode;
    containerStyle?: StyleProp<ViewStyle>;
    textContainerStyle?: StyleProp<ViewStyle>;
    textInputProps?: TextInputProps;
    textInputStyle?: StyleProp<TextStyle>;
    codeTextStyle?: StyleProp<TextStyle>;
    flagButtonStyle?: StyleProp<ViewStyle>;
    countryPickerButtonStyle?: StyleProp<ViewStyle>;
    layout?: "first" | "second";
    filterProps?: CountryFilterProps;
    countryPickerProps?: CountryPickerModalProps;
    flagSize?: number;
    showCountryCode?: boolean;
};

export type PhoneInputRefType = {
    getCountryCode: () => CountryCode;
    getCallingCode: () => CallingCode | undefined;
    isValidNumber: (number: string) => boolean;
    getNumberAfterPossiblyEliminatingZero: () => {
        number: string | undefined;
        formattedNumber: string | undefined;
    };
};

const PhoneInput = React.forwardRef<PhoneInputRefType, PhoneInputProps>((props, ref) => {
    const getCountryCodeByCallingCode = React.useCallback(async (callingCode: string) => {
        const countries = await loadDataAsync();
        if (!countries) return "US";

        const countryEntry = Object.entries(countries).find(([_, country]) => country.callingCode[0] === callingCode);

        return countryEntry ? (countryEntry[0] as CountryCode) : "US";
    }, []);

    const [code, setCode] = React.useState<string | undefined>(
        props.defaultCallingCode || (props.defaultCode ? undefined : "91")
    );
    const [number, setNumber] = React.useState<string | undefined>(undefined);
    const [modalVisible, setModalVisible] = React.useState<boolean>(false);
    const [countryCode, setCountryCode] = React.useState<CountryCode>(props.defaultCode || "IN");
    const [disabled, setDisabled] = React.useState<boolean>(props.disabled || false);

    React.useEffect(() => {
        const setupDefaultCallingCode = async () => {
            if (props.defaultCallingCode) {
                // eslint-disable-next-line @typescript-eslint/no-shadow
                const countryCode = await getCountryCodeByCallingCode(props.defaultCallingCode);
                setCountryCode(countryCode);
                setCode(props.defaultCallingCode);
            }
        };

        setupDefaultCallingCode();
    }, [props.defaultCallingCode, getCountryCodeByCallingCode]);

    React.useEffect(() => {
        const loadDefaultCode = async () => {
            if (props.defaultCode) {
                const callingCode = await getCallingCode(props.defaultCode);
                setCode(callingCode);
            }
        };
        loadDefaultCode();
    }, [props.defaultCode]);

    React.useEffect(() => {
        if (props.disabled !== disabled) {
            setDisabled(props.disabled || false);
        }
    }, [disabled, props.disabled]);

    const onSelect = React.useCallback(
        (country: Country) => {
            if (!props.onChangeCountry) return;

            setCountryCode(country.cca2);
            setCode(country.callingCode[0]);

            if (props.onChangeFormattedText) {
                if (country.callingCode[0]) {
                    props.onChangeFormattedText(`+${country.callingCode[0]}${number}`);
                } else {
                    props.onChangeFormattedText(number || "");
                }
            }

            props.onChangeCountry(country);
        },
        [number, props]
    );

    const onChangeText = React.useCallback(
        (text: string) => {
            setNumber(text);
            if (props.onChangeText) {
                props.onChangeText(text);
            }
            if (props.onChangeFormattedText) {
                if (code) {
                    props.onChangeFormattedText(text.length > 0 ? `+${code}${text}` : text);
                } else {
                    props.onChangeFormattedText(text);
                }
            }
        },
        [code, props]
    );

    const renderDefaultDropdownImage = React.useMemo(() => {
        return <Image source={{ uri: dropDown }} resizeMode="contain" style={styles.dropDownImage} />;
    }, []);

    const renderFlagButton = React.useCallback(() => {
        const { layout = "first", flagSize } = props;
        if (layout === "first") {
            return <Flag countryCode={countryCode} flagSize={flagSize || DEFAULT_THEME.flagSize} />;
        }
        return null;
    }, [countryCode, props]);

    React.useImperativeHandle(ref, () => ({
        getCountryCode: () => countryCode,
        getCallingCode: () => code,
        isValidNumber: (phoneNumber: string) => {
            if (!phoneNumber || !countryCode) {
                return false;
            }
            try {
                let cleanNumber = phoneNumber.replace(/[^\d+]/g, "");
                if (cleanNumber.startsWith("0")) {
                    cleanNumber = cleanNumber.substring(1);
                }
                if (!cleanNumber) {
                    return false;
                }
                const parsedNumber = phoneUtil.parse(cleanNumber, countryCode);
                return phoneUtil.isValidNumber(parsedNumber);
            } catch (err) {
                try {
                    if (code) {
                        let cleanNumber = phoneNumber.replace(/[^\d+]/g, "");
                        if (cleanNumber.startsWith("0")) {
                            cleanNumber = cleanNumber.substring(1);
                        }
                        const parsedNumber = phoneUtil.parse(cleanNumber, code);
                        return phoneUtil.isValidNumber(parsedNumber);
                    }
                } catch (fallbackErr) {
                    return false;
                }
                return false;
            }
        },
        getNumberAfterPossiblyEliminatingZero: () => {
            let currentNumber = number;
            if (currentNumber && currentNumber.length > 0 && currentNumber.startsWith("0")) {
                currentNumber = currentNumber.slice(1);
            }
            return {
                number: currentNumber,
                formattedNumber: code ? `+${code}${currentNumber}` : currentNumber
            };
        }
    }));

    const {
        withShadow,
        withDarkTheme,
        codeTextStyle,
        textInputProps,
        textInputStyle,
        autoFocus,
        placeholder,
        disableArrowIcon,
        flagButtonStyle,
        containerStyle,
        textContainerStyle,
        renderDropdownImage = renderDefaultDropdownImage,
        countryPickerProps = {
            theme: withDarkTheme ? DARK_THEME : DEFAULT_THEME
        },
        filterProps = {},
        countryPickerButtonStyle,
        layout = "first",
        onBlur,
        onFocus,
        showCountryCode = true
    } = props;

    return (
        <CountryModalProvider>
            <View style={[styles.container, withShadow && styles.shadow, containerStyle]}>
                <TouchableOpacity
                    style={[
                        styles.flagButtonView,
                        layout === "second" && styles.flagButtonExtraWidth,
                        flagButtonStyle,
                        countryPickerButtonStyle
                    ]}
                    disabled={disabled}
                    onPress={() => setModalVisible(true)}>
                    <CountryPicker
                        onSelect={onSelect}
                        withEmoji
                        withFilter
                        withFlag
                        filterProps={filterProps}
                        countryCode={countryCode}
                        withCallingCode
                        visible={modalVisible}
                        renderFlagButton={renderFlagButton}
                        onClose={() => setModalVisible(false)}
                        {...countryPickerProps}
                    />
                    {showCountryCode && code && layout === "second" && (
                        <Text style={[styles.codeText, codeTextStyle]}>{`+${code}`}</Text>
                    )}
                    {!disableArrowIcon && <React.Fragment>{renderDropdownImage}</React.Fragment>}
                </TouchableOpacity>
                <View style={[styles.textContainer, textContainerStyle]}>
                    {showCountryCode && code && layout === "first" && (
                        <Text style={[styles.codeText, codeTextStyle]}>{`+${code}`}</Text>
                    )}
                    <TextInput
                        style={[styles.numberText, textInputStyle]}
                        placeholder={placeholder}
                        onChangeText={onChangeText}
                        value={number || props.value || props.defaultValue || ""}
                        editable={!disabled}
                        selectionColor="black"
                        keyboardAppearance={withDarkTheme ? "dark" : "default"}
                        keyboardType="number-pad"
                        autoFocus={autoFocus}
                        onBlur={onBlur}
                        onFocus={onFocus}
                        {...textInputProps}
                    />
                </View>
            </View>
        </CountryModalProvider>
    );
});

export default PhoneInput;
