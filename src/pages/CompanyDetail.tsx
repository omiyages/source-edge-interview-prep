import { Navigate, useParams } from "react-router-dom";
import WovenCompanyPage from "./WovenCompanyPage";
import ShippioCompanyPage from "./ShippioCompanyPage";
import JapanAICompanyPage from "./JapanAICompanyPage";

const COMPANY_PAGE_MAP = {
  woven: WovenCompanyPage,
  shippio: ShippioCompanyPage,
  "japan-ai": JapanAICompanyPage,
} as const;

export default function CompanyDetail() {
  const { companyId } = useParams<{ companyId: string }>();

  if (!companyId) {
    return <Navigate to="/company" replace />;
  }

  const CompanyPage = COMPANY_PAGE_MAP[companyId as keyof typeof COMPANY_PAGE_MAP];

  if (!CompanyPage) {
    return <Navigate to="/company" replace />;
  }

  return <CompanyPage />;
}
