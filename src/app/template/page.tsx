import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Heart, MoreHorizontal, Share, Download, Copy, RefreshCcw, MessageSquare, Apple, Smartphone, Webhook, Slack } from 'lucide-react';

// Placeholder data
const placeholderImageUrl = "/fish-eating-pie-placeholder.png"; // You'll need to add a placeholder image here or use a remote URL
const placeholderPrompt = "fish eating pie";
const placeholderUsername = "@kai_en1";
const placeholderDate = "April 22, 2025";
const placeholderTags = ["Bubbles", "Dish", "Surreal", "Fish", "Fantasy", "Goldfish", "Food", "Water", "Cartoon", "Pie"];
const relatedEmojis = [
    { src: "/related1.png", alt: "Related Emoji 1" },
    { src: "/related2.png", alt: "Related Emoji 2" },
    { src: "/related3.png", alt: "Related Emoji 3" },
    { src: "/related4.png", alt: "Related Emoji 4" },
    { src: "/related5.png", alt: "Related Emoji 5" },
    { src: "/related6.png", alt: "Related Emoji 6" },
    { src: "/related7.png", alt: "Related Emoji 7" },
    { src: "/related8.png", alt: "Related Emoji 8" },
    // Add more placeholders as needed
];


export default function TemplatePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-col lg:flex-row gap-8 md:gap-12">

        {/* Left Column: Image */}
        <div className="flex-shrink-0 lg:w-1/2 flex flex-col items-center">
          <div className="relative aspect-square w-full max-w-md bg-secondary rounded-lg overflow-hidden border">
            {/* Placeholder Image */}
            <Image
              src={placeholderImageUrl}
              alt={placeholderPrompt}
              fill
              className="object-contain p-4" // Use object-contain to fit image within container
              unoptimized // Use unoptimized for external/placeholder URLs if needed
            />
            <div className="absolute top-2 right-2 flex gap-2">
              <Button variant="secondary" size="icon" className="rounded-full bg-background/70 hover:bg-background">
                <Heart className="h-4 w-4" />
              </Button>
              <Button variant="secondary" size="icon" className="rounded-full bg-background/70 hover:bg-background">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Button variant="secondary" className="mt-4 font-semibold">
            <RefreshCcw className="mr-2 h-4 w-4" /> Remix
          </Button>
        </div>

        {/* Right Column: Details */}
        <div className="flex-grow lg:w-1/2">
          {/* User Info */}
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-sm font-medium">
              {placeholderUsername.substring(1, 3).toUpperCase()} {/* Placeholder Initials */}
            </div>
            <span className="text-sm font-medium text-foreground">{placeholderUsername}</span>
          </div>

          {/* Prompt */}
          <h1 className="text-3xl md:text-4xl font-bold mb-6 break-words">
            {placeholderPrompt}
          </h1>

          {/* Metadata */}
          <div className="space-y-3 text-sm text-muted-foreground border-t border-b py-4 mb-6">
            <div className="flex justify-between">
              <span>Model</span>
              <span className="text-foreground font-medium">Emoji</span>
            </div>
            <div className="flex justify-between">
              <span>Dimensions</span>
              <span className="text-foreground font-medium">768x768</span>
            </div>
            <div className="flex justify-between">
              <span>Date</span>
              <span className="text-foreground font-medium">{placeholderDate}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline">
              <Share className="mr-2 h-4 w-4" /> Share
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" /> Download
            </Button>
            <Button variant="outline">
              <Copy className="mr-2 h-4 w-4" /> Copy
            </Button>
            <Button variant="outline" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Related Emojis Section */}
      <div className="mt-16 pt-8 border-t">
        <h2 className="text-xl font-semibold mb-4">Related emojis</h2>
        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-6">
          {placeholderTags.map((tag) => (
            <Button key={tag} variant="outline" size="sm" className="rounded-full">
              {tag}
            </Button>
          ))}
        </div>
        {/* Emoji Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-4">
          {relatedEmojis.map((emoji, index) => (
            <div key={index} className="aspect-square bg-secondary rounded-lg overflow-hidden relative border">
              <Image
                src={emoji.src}
                alt={emoji.alt}
                fill
                className="object-contain p-1"
                unoptimized // Use unoptimized for external/placeholder URLs if needed
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 