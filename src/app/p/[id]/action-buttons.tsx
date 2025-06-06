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
    if (!displayImageUrl) return;
    
    if (typeof navigator !== 'undefined' && 'share' in navigator && typeof navigator.share === 'function') {
      try {
        // Fetch the image as a blob
        const response = await fetch(displayImageUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.statusText}`);
        }
        const blob = await response.blob();
        
        // Create a File object from the blob
        const file = new File([blob], `${emojiPrompt.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${emojiId}.png`, { type: 'image/png' });
        
        // Share the image file
        await navigator.share({
          title: `אימוג׳י: ${emojiPrompt}`,
          text: `בוא לראות את האימוג׳י שיצרתי: ${emojiPrompt}`,
          files: [file],
        });
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
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 md:gap-2">
      <Button variant="outline" onClick={handleShare} className="flex-1 md:flex-none">
        <Share className="ml-2 h-4 w-4" /> שתף
      </Button>
      {displayImageUrl && (
        <Button variant="outline" onClick={handleDownload} disabled={isDownloading} className="flex-1 md:flex-none">
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