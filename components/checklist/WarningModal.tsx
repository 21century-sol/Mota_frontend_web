"use client";

interface Props {
  /** 이상이 확인된 항목명 (빨강 강조) */
  itemLabel: string;
  onClose?: () => void;
}

export default function WarningModal({ itemLabel, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50">
      <div className="relative h-full w-full">
        {/* 딤 오버레이 */}
        <div
          className="absolute inset-0 bg-[rgba(19,20,23,0.4)]"
          onClick={onClose}
        />

        {/* 팝업 카드 (좌우 16px, h354, 하단 36px) */}
        <div className="absolute inset-x-4 bottom-[36px] h-[354px] overflow-hidden rounded-[24px] bg-white">
          {/* 상단: 경고 아이콘 + 문구 */}
          <div className="absolute left-6 right-6 top-6 flex flex-col items-center gap-3">
            <div className="flex size-[60px] items-center justify-center rounded-[30px] bg-[rgba(254,61,22,0.3)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/modal-warning.svg"
                alt=""
                className="size-[30px]"
                aria-hidden
              />
            </div>
            <div className="flex flex-col items-center gap-4 text-center">
              <p className="w-full text-[18px] font-semibold leading-[1.5] text-black">
                운행 불가 항목 발견
              </p>
              <p className="w-full text-[14px] leading-[1.5]">
                <span className="font-semibold text-[#fe3d16]">{itemLabel}</span>
                <span className="font-medium text-[rgba(19,20,23,0.64)]">
                  {" "}
                  항목에서 이상 확인 되었습니다. 안전을 위해 고객센터로 연락해
                  주세요.
                </span>
              </p>
            </div>
          </div>

          {/* 하단: 고객센터 연결 + 닫기 */}
          <div className="absolute left-6 right-6 top-[214px] flex flex-col">
            <a
              href="tel:1588-5858"
              className="flex h-[58px] items-center justify-center rounded-[18px] bg-[#fe3d16] text-[16px] font-semibold leading-[1.5] text-white"
            >
              고객센터 연결(1588-5858)
            </a>
            <button
              type="button"
              onClick={onClose}
              className="flex h-[58px] items-center justify-center gap-2 rounded-[12px] text-[16px] font-semibold leading-[1.5] text-[#a4a8ae]"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
                <path
                  d="M16.0672 15.1828C16.1253 15.2409 16.1713 15.3098 16.2027 15.3857C16.2342 15.4616 16.2503 15.5429 16.2503 15.625C16.2503 15.7071 16.2342 15.7884 16.2027 15.8643C16.1713 15.9402 16.1253 16.0091 16.0672 16.0672C16.0091 16.1253 15.9402 16.1713 15.8643 16.2027C15.7884 16.2342 15.7071 16.2503 15.625 16.2503C15.5429 16.2503 15.4616 16.2342 15.3857 16.2027C15.3098 16.1713 15.2409 16.1253 15.1828 16.0672L10 10.8836L4.81719 16.0672C4.69991 16.1845 4.54085 16.2503 4.375 16.2503C4.20915 16.2503 4.05009 16.1845 3.93281 16.0672C3.81554 15.9499 3.74965 15.7909 3.74965 15.625C3.74965 15.4591 3.81554 15.3001 3.93281 15.1828L9.11641 10L3.93281 4.81719C3.81554 4.69991 3.74965 4.54085 3.74965 4.375C3.74965 4.20915 3.81554 4.05009 3.93281 3.93281C4.05009 3.81554 4.20915 3.74965 4.375 3.74965C4.54085 3.74965 4.69991 3.81554 4.81719 3.93281L10 9.11641L15.1828 3.93281C15.3001 3.81554 15.4591 3.74965 15.625 3.74965C15.7909 3.74965 15.9499 3.81554 16.0672 3.93281C16.1845 4.05009 16.2503 4.20915 16.2503 4.375C16.2503 4.54085 16.1845 4.69991 16.0672 4.81719L10.8836 10L16.0672 15.1828Z"
                  fill="#A4A8AE"
                />
              </svg>
              닫고 계속 점검
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
