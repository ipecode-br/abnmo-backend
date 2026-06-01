export const STORAGE_FOLDERS = {
  users: {
    avatars: '/users/avatars',
  },
  patients: {
    avatars: '/patients/avatars',
    documents: (id: string) => `/patients/documents/${id}`,
  },
};
