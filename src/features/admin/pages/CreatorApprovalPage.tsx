import { useState } from "react";
import { CheckCircle2, XCircle, Clock, Search, ExternalLink, Sparkles, Building2, User } from "lucide-react";
import { useCreatorApplications, useApproveCreatorApplication, useRejectCreatorApplication } from "../../creator/hooks";
import type { CreatorApplication, CreatorApplicationStatus } from "../../creator/types";
import { Button, Card, Badge, EmptyState, Dialog, DialogContent, DialogTitle, DialogDescription } from "../../../shared/ui";

export function CreatorApprovalPage() {
  const { data: applications = [], isLoading } = useCreatorApplications();
  const approveMutation = useApproveCreatorApplication();
  const rejectMutation = useRejectCreatorApplication();

  const [filter, setFilter] = useState<"ALL" | CreatorApplicationStatus>("PENDING");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedApp, setSelectedApp] = useState<CreatorApplication | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isApproveConfirmOpen, setIsApproveConfirmOpen] = useState(false);

  const pendingCount = applications.filter((a) => a.status === "PENDING").length;
  const approvedCount = applications.filter((a) => a.status === "APPROVED").length;
  const rejectedCount = applications.filter((a) => a.status === "REJECTED").length;

  const filtered = applications.filter((app) => {
    if (filter !== "ALL" && app.status !== filter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      app.userName.toLowerCase().includes(q) ||
      app.userEmail.toLowerCase().includes(q) ||
      app.creatorName.toLowerCase().includes(q) ||
      app.category.toLowerCase().includes(q)
    );
  });

  const handleApprove = () => {
    if (!selectedApp) return;
    approveMutation.mutate(selectedApp.id, {
      onSuccess: () => {
        setIsApproveConfirmOpen(false);
        setSelectedApp(null);
      },
    });
  };

  const handleReject = () => {
    if (!selectedApp || !rejectReason.trim()) return;
    rejectMutation.mutate(
      { applicationId: selectedApp.id, rejectReason: rejectReason.trim() },
      {
        onSuccess: () => {
          setIsRejectDialogOpen(false);
          setSelectedApp(null);
          setRejectReason("");
        },
      }
    );
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-2xl font-black text-ink">
            👤 창작자 심사 관리
          </h1>
          <p className="text-xs text-mist mt-1">
            후원자들의 창작자 전환 신청서를 심사하고 승인 또는 반려합니다.
          </p>
        </div>

        {/* Quick Stats Badges */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">
            <Clock className="h-3.5 w-3.5" /> 심사 대기 {pendingCount}건
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-mint/40 bg-mint/10 px-3 py-1 text-xs font-bold text-brand">
            <CheckCircle2 className="h-3.5 w-3.5" /> 승인 {approvedCount}건
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-bold text-red-600">
            <XCircle className="h-3.5 w-3.5" /> 반려 {rejectedCount}건
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-ink/10 pb-3">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setFilter("PENDING")}
            className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${
              filter === "PENDING"
                ? "bg-amber-500 text-white shadow-sm"
                : "bg-paper/80 text-mist hover:bg-paper hover:text-ink"
            }`}
          >
            심사 대기 ({pendingCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter("ALL")}
            className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${
              filter === "ALL"
                ? "bg-ink text-surface"
                : "bg-paper/80 text-mist hover:bg-paper hover:text-ink"
            }`}
          >
            전체 ({applications.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("APPROVED")}
            className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${
              filter === "APPROVED"
                ? "bg-brand text-white"
                : "bg-paper/80 text-mist hover:bg-paper hover:text-ink"
            }`}
          >
            승인 완료 ({approvedCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter("REJECTED")}
            className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${
              filter === "REJECTED"
                ? "bg-red-600 text-white"
                : "bg-paper/80 text-mist hover:bg-paper hover:text-ink"
            }`}
          >
            반려됨 ({rejectedCount})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-mist" />
          <input
            type="text"
            placeholder="이름, 활동명, 이메일 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-full border border-ink/20 bg-surface pl-8 pr-3 py-1.5 text-xs text-ink focus:border-brand focus:outline-none"
          />
        </div>
      </div>

      {/* Application List */}
      {isLoading ? (
        <div className="py-12 text-center text-sm text-mist">신청 목록을 불러오는 중...</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          message={
            filter === "PENDING"
              ? "현재 대기 중인 창작자 심사 요청이 없습니다."
              : "해당 조건의 창작자 신청 내역이 없습니다."
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((app) => (
            <Card
              key={app.id}
              className={`flex flex-col gap-4 border-2 transition-all ${
                app.status === "PENDING"
                  ? "border-amber-200 bg-amber-50/20 hover:border-amber-400"
                  : app.status === "APPROVED"
                  ? "border-mint/20 bg-mint/5"
                  : "border-red-200 bg-red-50/20"
              }`}
            >
              {/* Card Header: Applicant Info & Status Badge */}
              <div className="flex flex-wrap items-start justify-between gap-2 border-b border-ink/10 pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-paper text-ink font-bold border border-ink/10">
                    <User className="h-5 w-5 text-brand" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-display font-extrabold text-ink text-base">
                        {app.creatorName}
                      </span>
                      <span className="text-xs text-mist font-medium">({app.userName})</span>
                      <Badge tone="mint">{app.category}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-mist mt-0.5">
                      <span>이메일: {app.userEmail}</span>
                      <span>연락처: {app.userPhone}</span>
                      <span>신청: {new Date(app.appliedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div>
                  {app.status === "PENDING" && (
                    <Badge tone="peach" className="bg-amber-100 text-amber-900 border-amber-300 font-bold">
                      ⌛ 심사 대기
                    </Badge>
                  )}
                  {app.status === "APPROVED" && (
                    <Badge tone="mint" className="bg-mint/20 text-brand border-brand/30 font-bold">
                      ✅ 승인 완료
                    </Badge>
                  )}
                  {app.status === "REJECTED" && (
                    <Badge tone="peach" className="bg-red-100 text-red-700 border-red-300 font-bold">
                      ❌ 반려됨
                    </Badge>
                  )}
                </div>
              </div>

              {/* Card Content: Bank Info & Introduction */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3 text-sm">
                <div className="rounded-sm bg-white p-3.5 border border-ink/10">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-mist mb-1">
                    <Building2 className="h-3.5 w-3.5" /> 정산 계좌 정보
                  </div>
                  <div className="font-extrabold text-ink">{app.bankName}</div>
                  <div className="text-xs text-mist font-mono mt-0.5">{app.accountNumber}</div>
                  <div className="text-xs text-ink/80 mt-0.5">예금주: {app.accountHolder}</div>
                </div>

                <div className="col-span-2 rounded-sm bg-white p-3.5 border border-ink/10 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-mist mb-1">
                      <Sparkles className="h-3.5 w-3.5" /> 활동 소개 및 펀딩 계획
                    </div>
                    <p className="text-xs text-ink/90 whitespace-pre-wrap leading-relaxed">
                      {app.introduction}
                    </p>
                  </div>
                  {app.portfolioUrl && (
                    <div className="mt-2 text-xs">
                      <a
                        href={app.portfolioUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-brand hover:underline"
                      >
                        포트폴리오 / SNS 링크 <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Rejection Reason (if rejected) */}
              {app.status === "REJECTED" && app.rejectReason && (
                <div className="rounded-sm border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-800">
                  <strong>반려 사유</strong>: {app.rejectReason}
                </div>
              )}

              {/* Actions for PENDING status */}
              {app.status === "PENDING" && (
                <div className="flex items-center justify-end gap-2 border-t border-ink/10 pt-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setSelectedApp(app);
                      setRejectReason("");
                      setIsRejectDialogOpen(true);
                    }}
                    className="text-xs border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <XCircle className="mr-1 h-3.5 w-3.5" /> 반려하기
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      setSelectedApp(app);
                      setIsApproveConfirmOpen(true);
                    }}
                    className="text-xs bg-brand hover:bg-brand/90 text-white font-bold"
                  >
                    <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> 창작자 승인하기
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Approve Confirmation Dialog */}
      <Dialog open={isApproveConfirmOpen} onOpenChange={setIsApproveConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogTitle>창작자 승인 확인</DialogTitle>
          <DialogDescription>
            <strong>[{selectedApp?.creatorName}]</strong> ({selectedApp?.userName}님)의 창작자 신청을 승인하시겠습니까?
            승인 시 해당 유저의 권한이 창작자(CREATOR)로 전환됩니다.
          </DialogDescription>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsApproveConfirmOpen(false)}>
              취소
            </Button>
            <Button
              onClick={handleApprove}
              disabled={approveMutation.isPending}
              className="bg-brand text-white font-bold"
            >
              {approveMutation.isPending ? "승인 처리 중..." : "승인 확정 ✅"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Reason Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogTitle>창작자 신청 반려</DialogTitle>
          <DialogDescription>
            <strong>[{selectedApp?.creatorName}]</strong> 신청을 반려하는 사유를 입력해 주세요. 신청자가 수정하여 재신청할 때 안내됩니다.
          </DialogDescription>
          <div className="my-3 flex flex-col gap-2">
            <textarea
              required
              rows={3}
              placeholder="예: 정산 계좌 예금주 성명 불일치, 프로젝트 기획 내용 보완 필요 등"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full rounded-sm border border-ink/30 px-3 py-2 text-xs text-ink focus:border-brand focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsRejectDialogOpen(false)}>
              취소
            </Button>
            <Button
              disabled={rejectMutation.isPending || !rejectReason.trim()}
              onClick={handleReject}
              className="bg-red-600 text-white hover:bg-red-700 font-bold"
            >
              {rejectMutation.isPending ? "반려 처리 중..." : "반려 확정 ❌"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
