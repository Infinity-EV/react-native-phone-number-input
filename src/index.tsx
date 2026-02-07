import { PhoneNumberUtil } from "google-libphonenumber"
import React from "react"
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"

import CountryPicker, {
  CountryModalProvider,
  DARK_THEME,
  DEFAULT_THEME,
  getCallingCode,
  loadDataAsync,
  type CallingCode,
  type Country,
  type CountryCode,
} from "./countryPickerModal"
import { applyMask, getMaskForCountry, removeMask } from "./maskUtils"
import styles from "./styles"

const phoneUtil = PhoneNumberUtil.getInstance()

export type PhoneInputRefType = {
  getCountryCode: () => CountryCode
  getCallingCode: () => CallingCode | undefined
  isValidNumber: (number: string) => boolean
  getNumberAfterPossiblyEliminatingZero: () => {
    number: string | undefined
    formattedNumber: string | undefined
  }
  setCountryCode: (cca2: CountryCode) => Promise<void>
  setCallingCode: (callingCode: string) => Promise<void>
}

const PhoneInput = React.forwardRef<PhoneInputRefType, any>((props, ref) => {
  const getCountryCodeByCallingCode = React.useCallback(
    async (callingCode: string) => {
      const countries = await loadDataAsync()
      if (!countries) return "US"

      const entry = Object.entries(countries).find(
        ([_, c]) => c.callingCode[0] === callingCode
      )

      return entry ? (entry[0] as CountryCode) : "US"
    },
    []
  )

  const [countryCode, setCountryCode] = React.useState<CountryCode>(
    props.defaultCode || "US"
  )
  const [code, setCode] = React.useState<string | undefined>(undefined)
  const [number, setNumber] = React.useState<string>("")
  const [displayValue, setDisplayValue] = React.useState<string>("")
  const [modalVisible, setModalVisible] = React.useState(false)
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

  const applyCountry = React.useCallback(
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

  const onSelect = React.useCallback(
    (country: Country) => {
      applyCountry(country)
      setModalVisible(false)
    },
    [applyCountry]
  )

  const onChangeText = React.useCallback(
    (text: string) => {
      const raw = props.withMask ? removeMask(text) : text

      if (!raw) {
        setNumber("")
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

      if (props.onChangeFormattedText) {
        props.onChangeFormattedText(code ? `+${code}${raw}` : raw)
      }
    },
    [code, countryCode, props]
  )

  React.useImperativeHandle(ref, () => ({
    getCountryCode: () => countryCode,
    getCallingCode: () => code,

    setCountryCode: async (cca2: CountryCode) => {
      const callingCode = await getCallingCode(cca2)
      if (!callingCode) return

      applyCountry({
        cca2,
        callingCode: [callingCode],
      } as Country)
    },

    setCallingCode: async (callingCode: string) => {
      const cca2 = await getCountryCodeByCallingCode(callingCode)

      applyCountry({
        cca2,
        callingCode: [callingCode],
      } as Country)
    },

    isValidNumber: (value: string) => {
      try {
        const parsed = phoneUtil.parse(value, countryCode)
        return phoneUtil.isValidNumber(parsed)
      } catch {
        return false
      }
    },

    getNumberAfterPossiblyEliminatingZero: () => {
      const clean = number.startsWith("0") ? number.slice(1) : number
      return {
        number: clean,
        formattedNumber: code ? `+${code}${clean}` : clean,
      }
    },
  }))

  const {
    withShadow,
    withDarkTheme,
    containerStyle,
    textContainerStyle,
    textInputStyle,
    textInputProps,
    placeholder,
    showCountryCode = true,
    countryPickerProps = {
      theme: withDarkTheme ? DARK_THEME : DEFAULT_THEME,
    },
  } = props

  return (
    <CountryModalProvider>
      <View style={[styles.container, withShadow && styles.shadow, containerStyle]}>
        <TouchableOpacity
          disabled={disabled}
          style={styles.flagButtonView}
          onPress={() => setModalVisible(true)}
        >
          <CountryPicker
            visible={modalVisible}
            onClose={() => setModalVisible(false)}
            countryCode={countryCode}
            withCallingCode
            withFlag
            onSelect={onSelect}
            {...countryPickerProps}
          />
        </TouchableOpacity>

        <View style={[styles.textContainer, textContainerStyle]}>
          {showCountryCode && code && (
            <Text style={styles.codeText}>{`+${code}`}</Text>
          )}
          <TextInput
            value={props.withMask ? displayValue : number}
            onChangeText={onChangeText}
            placeholder={placeholder}
            keyboardType="phone-pad"
            editable={!disabled}
            style={[styles.numberText, textInputStyle]}
            {...textInputProps}
          />
        </View>
      </View>
    </CountryModalProvider>
  )
})

export default PhoneInput
