"use client";

import { Button } from '@/components/ui/button';
import { Share, Download, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';

interface ActionButtonsProps {
  displayImageUrl: string | null;
  emojiId: string;
  emojiPrompt: string;
}

export function ActionButtons({ displayImageUrl, emojiId, emojiPrompt }: ActionButtonsProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    // Initial check
    checkIfMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const handleShare = async () => {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    
    if (typeof navigator !== 'undefined' && 'share' in navigator && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: `אימוג׳י: ${emojiPrompt}`,
          text: `בוא לראות את האימוג׳י שיצרתי: ${emojiPrompt}`,
          url: shareUrl,
        });
        toast.success('שותף בהצלחה!');
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Share failed:', err);
          await handleCopyLink();
        }
      }
    } else {
      await handleCopyLink();
    }
  };

  const handleCopyLink = async () => {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('הקישור הועתק!');
    } catch (err) {
      console.error('Failed to copy URL:', err);
      toast.error('העתקת הקישור נכשלה.');
    }
  };

  const handleCopy = async () => {
    if (!displayImageUrl) return;
    try {
      await navigator.clipboard.writeText(displayImageUrl);
      toast.success('הקישור הועתק!');
    } catch (err) {
      console.error('Failed to copy URL: ', err);
      toast.error('העתקת הקישור נכשלה.');
    }
  };

  const handleDownload = async () => {
    if (!displayImageUrl) return;

    setIsDownloading(true);
    toast.loading('מתחיל הורדה...', { id: 'download-toast' });

    try {
      const response = await fetch(displayImageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      const filename = `${emojiPrompt.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${emojiId}.png`;
      link.download = filename;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(blobUrl);
      toast.success('ההורדה החלה!', { id: 'download-toast' });
    } catch (error) {
      console.error('Download failed:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`ההורדה נכשלה: ${errorMsg}`, { id: 'download-toast' });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" onClick={handleShare}>
        <Share className="ml-2 h-4 w-4" /> שתף
      </Button>
      {displayImageUrl && (
        <Button variant="outline" onClick={handleDownload} disabled={isDownloading}>
          {isDownloading ? (
            <span className="animate-spin ml-2 h-4 w-4">⏳</span>
          ) : (
            <Download className="ml-2 h-4 w-4" />
          )}
          הורדה
        </Button>
      )}
      {/* Only show copy link button on desktop */}
      {displayImageUrl && !isMobile && (
        <Button variant="outline" onClick={handleCopy}>
          <Copy className="ml-2 h-4 w-4" /> העתק קישור
        </Button>
      )}
    </div>
  );
} 