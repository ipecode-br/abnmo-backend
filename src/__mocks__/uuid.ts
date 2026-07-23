import { faker } from '@faker-js/faker';

export const v7 = () => faker.string.uuid({ version: 7 });
export const v4 = () => faker.string.uuid({ version: 4 });
export const v1 = () => faker.string.uuid();
export const NIL = '00000000-0000-0000-0000-000000000000';
export const MAX = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
export const parse = () => new Uint8Array(16);
export const stringify = () => '00000000-0000-0000-0000-000000000000';
export const validate = () => true;
export const version = () => 7;
