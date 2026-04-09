import React from "react";
import { useLocation, Link } from "react-router-dom";
import { Card } from "../../../components/m3/Card";
import { Button } from "../../../components/m3/Button";
import { CheckCircle, AlertTriangle, Home, ArrowLeft } from "lucide-react";

export const VoteSuccess: React.FC = () => {
  const location = useLocation();
  const receipt = location.state?.receipt;

  if (!receipt) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] p-4 animate-fade-in">
        <Card className="max-w-md w-full p-8 text-center flex flex-col items-center gap-4">
          <div className="p-4 rounded-full bg-[var(--color-error-container)] text-[var(--color-on-error-container)]">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-[var(--color-on-surface)]">
            找不到收執聯
          </h2>
          <p className="text-[var(--color-on-surface-variant)]">請返回首頁。</p>
          <Link to="/" className="w-full">
            <Button
              variant="outlined"
              className="w-full"
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              返回首頁
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-[80vh] p-4 animate-fade-in pb-24">
      <Card className="max-w-xl w-full p-8 text-center space-y-6">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-[var(--color-primary-container)] mb-2 shadow-lg animate-scale-in">
          <CheckCircle className="w-12 h-12 text-[var(--color-on-primary-container)]" />
        </div>

        <div>
          <h1 className="text-3xl font-bold text-[var(--color-on-surface)] mb-2">
            投票成功！
          </h1>
          <p className="text-[var(--color-on-surface-variant)]">
            選舉結束後將進行開票。
          </p>
        </div>

        <div className="pt-4">
          <Link to="/">
            <Button
              className="w-full h-12 text-lg"
              icon={<Home className="w-5 h-5" />}
            >
              返回首頁
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};
