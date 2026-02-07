import { PhoneNumberUtil } from "google-libphonenumber"
import React from "react"
import {
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
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
} from "./countryPickerModal"
import { applyMask, getMaskForCountry, removeMask } from "./maskUtils"
import styles from "./styles"

const dropDown =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAi0lEQVRYR+3WuQ6AIBRE0eHL1T83FBqU5S1szdiY2NyTKcCAzU/Y3AcBXIALcIF0gRPAsehgugDEXnYQrUC88RIgfpuJ+MRrgFmILN4CjEYU4xJgFKIa1wB6Ec24FuBFiHELwIpQxa0ALUId9wAkhCnuBdQQ5ngP4I9wxXsBDyJ9m+8y/g9wAS7ABW4giBshQZji3AAAAABJRU5ErkJggg=="

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
  const [number, setNumber] = React.useState("")
  const [displayValue, setDisplayValue] = React.useState("")
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
      props.onChangeFormattedText?.(code ? `+${code}${raw}` : raw)
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
    codeTextStyle,
    renderDropdownImage,
    disableArrowIcon,
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

          {showCountryCode && code && (
            <Text style={[styles.codeText, codeTextStyle]}>
              {`+${code}`}
            </Text>
          )}

          {!disableArrowIcon && (
            renderDropdownImage ?? (
              <Image
                source={{ uri: dropDown }}
                resizeMode="contain"
                style={styles.dropDownImage}
              />
            )
          )}
        </TouchableOpacity>

        <View style={[styles.textContainer, textContainerStyle]}>
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
