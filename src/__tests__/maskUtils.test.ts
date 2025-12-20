import {
    applyMask,
    getMaskForCountry,
    getMaxDigits,
    getNewCursorPosition,
    isLiteralPosition,
    removeMask
} from "../maskUtils";

describe("maskUtils", () => {
    describe("removeMask", () => {
        it("should remove all non-digit characters", () => {
            expect(removeMask("(123) 456-7890")).toBe("1234567890");
            expect(removeMask("123 456 7890")).toBe("1234567890");
            expect(removeMask("123-456-7890")).toBe("1234567890");
            expect(removeMask("+1 (123) 456-7890")).toBe("11234567890");
        });

        it("should handle empty string", () => {
            expect(removeMask("")).toBe("");
        });

        it("should handle string with only digits", () => {
            expect(removeMask("1234567890")).toBe("1234567890");
        });

        it("should handle string with no digits", () => {
            expect(removeMask("abc-def")).toBe("");
        });
    });

    describe("getMaskForCountry", () => {
        it("should return correct mask for US", () => {
            expect(getMaskForCountry("US")).toBe("(###) ###-####");
        });

        it("should return correct mask for VN", () => {
            expect(getMaskForCountry("VN")).toBe("### ### ####");
        });

        it("should return correct mask for GB", () => {
            expect(getMaskForCountry("GB")).toBe("##### ######");
        });

        it("should return correct mask for CA", () => {
            expect(getMaskForCountry("CA")).toBe("(###) ###-####");
        });

        it("should return correct mask for AU", () => {
            expect(getMaskForCountry("AU")).toBe("#### ### ###");
        });

        it("should return correct mask for FR", () => {
            expect(getMaskForCountry("FR")).toBe("## ## ## ## ##");
        });

        it("should return correct mask for DE", () => {
            expect(getMaskForCountry("DE")).toBe("#### ########");
        });

        it("should return correct mask for JP", () => {
            expect(getMaskForCountry("JP")).toBe("###-####-####");
        });

        it("should return correct mask for CN", () => {
            expect(getMaskForCountry("CN")).toBe("### #### ####");
        });

        it("should return correct mask for IN", () => {
            expect(getMaskForCountry("IN")).toBe("##### #####");
        });

        it("should return default mask for unknown country", () => {
            // @ts-expect-error Testing with invalid country code
            expect(getMaskForCountry("XX")).toBe("### ### ### ###");
        });
    });

    describe("applyMask", () => {
        it("should apply US mask correctly", () => {
            const mask = "(###) ###-####";
            expect(applyMask("1234567890", mask)).toBe("(123) 456-7890");
            expect(applyMask("123456", mask)).toBe("(123) 456");
            expect(applyMask("123", mask)).toBe("(123");
        });

        it("should apply VN mask correctly", () => {
            const mask = "### ### ####";
            expect(applyMask("0123456789", mask)).toBe("012 345 6789");
            expect(applyMask("012345", mask)).toBe("012 345");
            expect(applyMask("012", mask)).toBe("012");
        });

        it("should apply GB mask correctly", () => {
            const mask = "##### ######";
            expect(applyMask("07700900123", mask)).toBe("07700 900123");
            expect(applyMask("07700", mask)).toBe("07700");
        });

        it("should handle empty input", () => {
            const mask = "(###) ###-####";
            expect(applyMask("", mask)).toBe("");
        });

        it("should handle input with existing formatting", () => {
            const mask = "(###) ###-####";
            expect(applyMask("(123) 456-7890", mask)).toBe("(123) 456-7890");
            expect(applyMask("123-456-7890", mask)).toBe("(123) 456-7890");
        });

        it("should handle input longer than mask", () => {
            const mask = "(###) ###-####";
            expect(applyMask("12345678901234", mask)).toBe("(123) 456-78901234");
        });

        it("should handle partial input", () => {
            const mask = "(###) ###-####";
            expect(applyMask("1", mask)).toBe("(1");
            expect(applyMask("12", mask)).toBe("(12");
            expect(applyMask("123", mask)).toBe("(123");
            expect(applyMask("1234", mask)).toBe("(123) 4");
        });
    });

    describe("getNewCursorPosition", () => {
        it("should calculate cursor position after adding digit", () => {
            const previousValue = "(123) 45";
            const newValue = "(123) 456";
            const previousCursor = 8; // After '5'
            const newCursor = getNewCursorPosition(previousValue, newValue, previousCursor);
            expect(newCursor).toBe(8); // Still after '5', before '6'
        });

        it("should handle cursor at beginning", () => {
            const previousValue = "";
            const newValue = "(1";
            const previousCursor = 0;
            const newCursor = getNewCursorPosition(previousValue, newValue, previousCursor);
            expect(newCursor).toBe(0);
        });

        it("should handle cursor after literal character", () => {
            const previousValue = "(123";
            const newValue = "(123) ";
            const previousCursor = 4; // After '3'
            const newCursor = getNewCursorPosition(previousValue, newValue, previousCursor);
            expect(newCursor).toBe(4); // Still after '3'
        });

        it("should handle empty previous value", () => {
            const previousValue = "";
            const newValue = "(123) 456-7890";
            const previousCursor = 0;
            const newCursor = getNewCursorPosition(previousValue, newValue, previousCursor);
            expect(newCursor).toBe(0);
        });
    });

    describe("isLiteralPosition", () => {
        it("should identify literal positions in US mask", () => {
            const mask = "(###) ###-####";
            expect(isLiteralPosition(mask, 0)).toBe(true); // '('
            expect(isLiteralPosition(mask, 1)).toBe(false); // '#'
            expect(isLiteralPosition(mask, 4)).toBe(true); // ')'
            expect(isLiteralPosition(mask, 5)).toBe(true); // ' '
            expect(isLiteralPosition(mask, 9)).toBe(true); // '-'
        });

        it("should identify literal positions in VN mask", () => {
            const mask = "### ### ####";
            expect(isLiteralPosition(mask, 0)).toBe(false); // '#'
            expect(isLiteralPosition(mask, 3)).toBe(true); // ' '
            expect(isLiteralPosition(mask, 7)).toBe(true); // ' '
        });

        it("should handle position beyond mask length", () => {
            const mask = "###";
            expect(isLiteralPosition(mask, 10)).toBe(false);
        });
    });

    describe("getMaxDigits", () => {
        it("should count digits in US mask", () => {
            expect(getMaxDigits("(###) ###-####")).toBe(10);
        });

        it("should count digits in VN mask", () => {
            expect(getMaxDigits("### ### ####")).toBe(10);
        });

        it("should count digits in GB mask", () => {
            expect(getMaxDigits("##### ######")).toBe(11);
        });

        it("should handle mask with no digits", () => {
            expect(getMaxDigits("---")).toBe(0);
        });

        it("should handle empty mask", () => {
            expect(getMaxDigits("")).toBe(0);
        });
    });

    describe("Integration tests", () => {
        it("should handle complete phone number entry flow for US", () => {
            const mask = getMaskForCountry("US");
            const inputs = [
                "1",
                "12",
                "123",
                "1234",
                "12345",
                "123456",
                "1234567",
                "12345678",
                "123456789",
                "1234567890"
            ];
            const expected = [
                "(1",
                "(12",
                "(123",
                "(123) 4",
                "(123) 45",
                "(123) 456",
                "(123) 456-7",
                "(123) 456-78",
                "(123) 456-789",
                "(123) 456-7890"
            ];

            inputs.forEach((input, index) => {
                expect(applyMask(input, mask)).toBe(expected[index]);
            });
        });

        it("should handle complete phone number entry flow for VN", () => {
            const mask = getMaskForCountry("VN");
            const inputs = [
                "0",
                "01",
                "012",
                "0123",
                "01234",
                "012345",
                "0123456",
                "01234567",
                "012345678",
                "0123456789"
            ];
            const expected = [
                "0",
                "01",
                "012",
                "012 3",
                "012 34",
                "012 345",
                "012 345 6",
                "012 345 67",
                "012 345 678",
                "012 345 6789"
            ];

            inputs.forEach((input, index) => {
                expect(applyMask(input, mask)).toBe(expected[index]);
            });
        });

        it("should handle paste operation", () => {
            const mask = getMaskForCountry("US");
            expect(applyMask("1234567890", mask)).toBe("(123) 456-7890");
            expect(applyMask("(123) 456-7890", mask)).toBe("(123) 456-7890");
            expect(applyMask("123-456-7890", mask)).toBe("(123) 456-7890");
        });

        it("should handle country switching", () => {
            const digits = "1234567890";
            const usMask = getMaskForCountry("US");
            const vnMask = getMaskForCountry("VN");

            expect(applyMask(digits, usMask)).toBe("(123) 456-7890");
            expect(applyMask(digits, vnMask)).toBe("123 456 7890");
        });
    });
});
