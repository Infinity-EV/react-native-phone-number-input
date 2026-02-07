import { PhoneNumberUtil } from "google-libphonenumber"
import React from "react"
import {
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from "react-native"

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
  type CountryPickerModalProps,
} from "./countryPickerModal"
import { applyMask, getMaskForCountry, removeMask } from "./maskUtils"
import styles from "./styles"

const dropDown =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAi0lEQVRYR+3WuQ6AIBRE0eHL1T83FBqU5S1szdiY2NyTKcCAzU/Y3AcBXIALcIF0gRPAsehgugDEXnYQrUC88RIgfpuJ+MRrgFmILN4CjEYU4xJgFKIa1wB6Ec24FuBFiHELwIpQxa0ALUId9wAkhCnuBdQQ5ngP4I9wxXsBDyJ9m+8y/g9wAS7ABW4giBshQZji3AAAAABJRU5ErkJggg=="

const phoneUtil = PhoneNumberUtil.getInstance()

export type PhoneInputProps = {
  withDarkTheme?: boolean
  withShadow?: boolean
  withMask?: boolean
  autoFocus?: boolean
  defaultCode?: CountryCode
  defaultCallingCode?: string
  value?: string
  defaultValue?: string
  disabled?: boolean
  disableArrowIcon?: boolean
  placeholder?: string
  onChangeCountry?: (country: Country) => void
  onChangeText?: (text: string) => void
  onChangeFormattedText?: (text: string) => void
  onBlur?: () => void
  onFocus?: () => void
  renderDropdownImage?: React.ReactNode
  containerStyle?: StyleProp<ViewStyle>
  textContainerStyle?: StyleProp<ViewStyle>
  textInputProps?: TextInputProps
  textInputStyle?: StyleProp<TextStyle>
  codeTextStyle?: StyleProp<TextStyle>
  flagButtonStyle?: StyleProp<ViewStyle>
  countryPickerButtonStyle?: StyleProp<ViewStyle>
  layout?: "first" | "second"
  filterProps?: CountryFilterProps
  countryPickerProps?: CountryPickerModalProps
  flagSize?: number
  showCountryCode?: boolean
}

export type PhoneInputRefType = {
  getCountryCode: () => CountryCode
  getCallingCode: () => CallingCode | undefined
  isValidNumber: (number: string) => boolean
  getNumberAfterPossiblyEliminatingZero: () => {
    number: string | undefined
    formattedNumber: string | undefined
  }
}

const PhoneInput = React.forwardRef<PhoneInputRefType, PhoneInputProps>((props, ref) => {
  const getCountryCodeByCallingCode = React.useCallback(async (callingCode: string) => {
    const countries = await loadDataAsync()
    if (!countries) return "US"

    const entry = Object.entries(countries).find(
      ([_, c]) => c.callingCode[0] === callingCode
    )

    return entry ? (entry[0] as CountryCode) : "US"
  }, [])

  const [code, setCode] = React.useState<string | undefined>(
    props.defaultCallingCode || (props.defaultCode ? undefined : "91")
  )
  const [number, setNumber] = React.useState<string | undefined>(undefined)
  const [displayValue, setDisplayValue] = React.useState("")
  const [modalVisible, setModalVisible] = React.useState(false)
  const [countryCode, setCountryCode] = React.useState<CountryCode>(
    props.defaultCode || "IN"
  )
  const [disabled, setDisabled] = React.useState(!!props.disabled)

  React.useEffect(() => {
    if (props.defaultCallingCode) {
      getCountryCodeByCallingCode(props.defaultCallingCode).then((cca2) => {
        setCountryCode(cca2)
        setCode(props.defaultCallingCode)
      })
    }
  }, [props.defaultCallingCode, getCountryCodeByCallingCode])

  React.useEffect(() => {
    if (props.defaultCode) {
      getCallingCode(props.defaultCode).then(setCode)
    }
  }, [props.defaultCode])

  React.useEffect(() => {
    setDisabled(!!props.disabled)
  }, [props.disabled])

  const onSelect = React.useCallback(
    (country: Country) => {
      setCountryCode(country.cca2)
      setCode(country.callingCode[0])

      if (props.withMask) {
        const mask = getMaskForCountry(country.cca2)
        setDisplayValue(number ? applyMask(number, mask) : "")
      }

      props.onChangeCountry?.(country)
    },
    [number, props]
  )

  const onChangeText = React.useCallback(
    (text: string) => {
      const raw = props.withMask ? removeMask(text) : text

      if (!raw) {
        setNumber(undefined)
        setDisplayValue("")
        props.onChangeText?.("")
        props.onChangeFormattedText?.("")
        return
      }

      setNumber(raw)

      if (props.withMask) {
        const mask = getMaskForCountry(countryCode)
        setDisplayValue(applyMask(raw, mask))
      }

      props.onChangeText?.(raw)
      props.onChangeFormattedText?.(code ? `+${code}${raw}` : raw)
    },
    [code, countryCode, props]
  )

  const renderDefaultDropdownImage = React.useMemo(
    () => <Image source={{ uri: dropDown }} resizeMode="contain" style={styles.dropDownImage} />,
    []
  )

  const renderFlagButton = React.useCallback(() => {
    const { layout = "first", flagSize } = props
    if (layout === "first") {
      return <Flag countryCode={countryCode} flagSize={flagSize || DEFAULT_THEME.flagSize} />
    }
    return null
  }, [countryCode, props])

  React.useImperativeHandle(ref, () => ({
    getCountryCode: () => countryCode,
    getCallingCode: () => code,
    isValidNumber: (value: string) => {
      try {
        if (!value) return false
        let clean = value.replace(/[^\d+]/g, "")
        if (clean.startsWith("0")) clean = clean.slice(1)
        const parsed = phoneUtil.parse(clean, countryCode)
        return phoneUtil.isValidNumber(parsed)
      } catch {
        return false
      }
    },
    getNumberAfterPossiblyEliminatingZero: () => {
      let current = number
      if (current?.startsWith("0")) current = current.slice(1)
      return {
        number: current,
        formattedNumber: code ? `+${code}${current}` : current,
      }
    },
  }))

  const {
    withShadow,
    withDarkTheme,
    withMask = false,
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
      theme: withDarkTheme ? DARK_THEME : DEFAULT_THEME,
    },
    filterProps = {},
    countryPickerButtonStyle,
    layout = "first",
    onBlur,
    onFocus,
    showCountryCode = true,
  } = props

  return (
    <CountryModalProvider>
      <View style={[styles.container, withShadow && styles.shadow, containerStyle]}>
        <TouchableOpacity
          style={[
            styles.flagButtonView,
            layout === "second" && styles.flagButtonExtraWidth,
            flagButtonStyle,
            countryPickerButtonStyle,
          ]}
          disabled={disabled}
          onPress={() => setModalVisible(true)}
        >
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

          {!disableArrowIcon && <>{renderDropdownImage}</>}
        </TouchableOpacity>

        <View style={[styles.textContainer, textContainerStyle]}>
          {showCountryCode && code && layout === "first" && (
            <Text style={[styles.codeText, codeTextStyle]}>{`+${code}`}</Text>
          )}

          <TextInput
            style={[styles.numberText, textInputStyle]}
            placeholder={placeholder}
            onChangeText={onChangeText}
            value={
              withMask
                ? displayValue || props.value || props.defaultValue || ""
                : number || props.value || props.defaultValue || ""
            }
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
  )
})

export default PhoneInput
