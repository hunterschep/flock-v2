'use client';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`skeleton rounded-lg ${className}`} />
  );
}

export function UserCardSkeleton() {
  return (
    <div className="glass-card p-6 relative overflow-hidden">
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        <Skeleton className="w-14 h-14 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      
      {/* Divider */}
      <div className="h-px bg-white/10 mb-4" />
      
      {/* Content */}
      <div className="space-y-2 mb-4 h-[72px]">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      
      {/* Location */}
      <Skeleton className="h-10 w-full rounded-lg mb-4" />
      
      {/* Badge area */}
      <Skeleton className="h-8 w-1/2 rounded-lg mb-4" />
      
      {/* Button */}
      <Skeleton className="h-11 w-full rounded-xl" />
    </div>
  );
}

export function ConversationSkeleton() {
  return (
    <div className="p-4 flex items-start gap-3">
      <Skeleton className="w-12 h-12 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-12" />
        </div>
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}

export function MessageSkeleton({ isOwn = false }: { isOwn?: boolean }) {
  return (
    <div className={`flex gap-2 mb-3 ${isOwn ? 'justify-end' : 'justify-start'}`}>
      {!isOwn && <Skeleton className="w-8 h-8 rounded-full shrink-0" />}
      <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[70%]`}>
        <Skeleton className={`h-12 ${isOwn ? 'w-40' : 'w-48'} rounded-2xl`} />
        <Skeleton className="h-3 w-16 mt-1" />
      </div>
      {isOwn && <Skeleton className="w-8 h-8 rounded-full shrink-0" />}
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="glass-card p-5 text-center">
      <Skeleton className="w-12 h-12 rounded-2xl mx-auto mb-3" />
      <Skeleton className="h-8 w-16 mx-auto mb-1" />
      <Skeleton className="h-3 w-20 mx-auto" />
    </div>
  );
}

export function AnalyticsListSkeleton() {
  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-3 mb-6">
        <Skeleton className="w-12 h-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="flex items-center gap-3">
              <Skeleton className="w-6 h-6 rounded-lg" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-8" />
            </div>
            <Skeleton className="h-2 w-full rounded-full ml-9" />
          </div>
        ))}
      </div>
    </div>
  );
}

