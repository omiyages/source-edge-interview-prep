import { useDropdownOptions } from './useDropdownOptions';

export const useCompanyOptions = () => {
  const { options, isLoading, addOption } = useDropdownOptions('company');
  return { companies: options, isLoading, addCompany: addOption };
};
