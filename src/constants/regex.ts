export const NON_NUMBER_REGEX = /\D/g;
export const NUMBER_REGEX = /\d/;
export const ONLY_NUMBERS_REGEX = /^\d+$/;

export const NAME_REGEX =
  /^(?!\s)(?!.*\s{2})[A-Za-zÀ-ÿ]+(?: [A-Za-zÀ-ÿ]+){1,49}$/;
export const UPPERCASE_REGEX = /^(?=.*[A-Z]).*$/;
export const LOWERCASE_REGEX = /^(?=.*[a-z]).*$/;
export const SPECIAL_CHAR_REGEX = /^(?=.*\W).*$/;
export const NON_SPECIAL_CHAR_REGEX = /^[a-zA-ZÀ-ÿ\s'-]{1,50}$/;

/*
  (?=.*\d)    should contain at least 1 digit
  (?=.*[a-z]) should contain at least 1 lowercase letter
  (?=.*[A-Z]) should contain at least 1 uppercase letter
  (?=.*\W)    should contain at least 1 special character
  (?!.*\s)    should not contain any blank space
*/
export const PASSWORD_REGEX =
  /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*\W)(?!.*\s).*$/;
