/* eslint-disable @typescript-eslint/require-await */
import * as otpGenerator from 'otp-generator';

export const GenerateOtp = async () => {
  const otp = otpGenerator.generate(6, {
    upperCaseAlphabets: false,
    specialChars: false,
    lowerCaseAlphabets: false,
  });
  return otp;
};
