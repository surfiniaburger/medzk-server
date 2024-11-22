/* eslint-disable react/no-children-prop */
/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React from "react";
import PropTypes from 'prop-types';
import { useMediaQuery } from "@/hooks/use-media-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ExternalLink, Copy, CheckCircle2, MapPin } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
    TooltipProvider,
  } from "@/components/ui/tooltip";
import Chat from './Chat';

// Custom component to handle source citations
const SourceCitation = ({ children }) => {
    const [copied, setCopied] = React.useState(false);
  const sourceRegex = /\[Source: (.*?)\. (.*?)\. (.*?)\]/;
  const match = children.match(sourceRegex);
  
  if (!match) return children;
  
  const [_, organization, title, url] = match;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`https://${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };
  
  return (
    <div className="mt-2 p-3 rounded-lg bg-gray-50 border border-gray-200">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-1">
            <span className="font-medium text-gray-700">Source: </span>
            <span className="font-medium text-gray-900">{organization}</span>
          </p>
          <p className="text-sm text-gray-700">{title}</p>
        </div>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={handleCopy}
              >
                {copied ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4 text-gray-500" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{copied ? 'Copied!' : 'Copy URL'}</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <a
                href={`https://${url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-gray-100"
              >
                <ExternalLink className="h-4 w-4 text-blue-600" />
              </a>
            </TooltipTrigger>
            <TooltipContent>
              <p>Open in new tab</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
      <a
        href={`https://${url}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-blue-600 hover:text-blue-800 hover:underline mt-1 inline-block"
      >
        {url}
      </a>
    </div>
  );
};

function PredictionResult({ predictionResult }) {
  const [open, setOpen] = React.useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [mapData, setMapData] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  if (!predictionResult) return null;

  const { groundedPredictionOutput, threadId } = predictionResult;

  // Process the markdown to handle source citations
  const processContent = (content) => {
    if (typeof content !== 'string') return content;
    
    // Split content by facts to handle sources separately
    return content.split('* **Fact:**').map((section, index) => {
      if (index === 0) return section;
      
      const [factContent, ...rest] = section.split('[Source:');
      if (rest.length === 0) return `* **Fact:**${section}`;
      
      return `* **Fact:**${factContent}\n<SourceCitation>[Source:${rest.join('[Source:')}`;
    }).join('\n');
  };

  const API_BASE = process.env.NODE_ENV === 'production' 
    ? 'https://medzk-server.onrender.com'
    : 'http://localhost:5050';
  

  const handleMapClick = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/map`);
      const data = await response.json();
      setMapData(data);
    } catch (error) {
      console.error("Error fetching map data:", error);
    } finally {
      setLoading(false);
    }
  };

  const components = {
    h1: ({ children }) => <h1 className="text-2xl font-bold mt-6 mb-4">{children}</h1>,
    h2: ({ children }) => <h2 className="text-xl font-semibold mt-5 mb-3">{children}</h2>,
    h3: ({ children }) => <h3 className="text-lg font-medium mt-4 mb-2">{children}</h3>,
    h4: ({ children }) => <h4 className="text-base font-medium mt-3 mb-2">{children}</h4>,
    p: ({ children }) => {
      if (typeof children === 'string' && children.includes('[Source:')) {
        return <SourceCitation>{children}</SourceCitation>;
      }
      return <p className="my-3 text-gray-700 leading-relaxed">{children}</p>;
    },
    ul: ({ children }) => <ul className="list-disc pl-6 my-3 space-y-4">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal pl-6 my-3 space-y-2">{children}</ol>,
    li: ({ children }) => {
      if (Array.isArray(children)) {
        // Handle list items that contain both fact and source
        const textContent = children.filter(child => typeof child === 'string' || child.type !== SourceCitation);
        const sourceCitation = children.find(child => child.type === SourceCitation);
        
        return (
          <li className="text-gray-700">
            <div>{textContent}</div>
            {sourceCitation}
          </li>
        );
      }
      return <li className="text-gray-700">{children}</li>;
    },
    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    SourceCitation: SourceCitation,
  };

  const DialogContentRender = (
    <>
      <DialogHeader>
        <DialogTitle>Prediction Results</DialogTitle>
        <DialogDescription>
          View the prediction results and insights below.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 mt-4">
        <ScrollArea className="max-h-[40vh]">
          <div className="px-1">
            <ReactMarkdown
              children={processContent(groundedPredictionOutput) || "No prediction available"}
              remarkPlugins={[remarkGfm]}
              components={components}
              className="prose prose-sm max-w-none"
            />
          </div>
        </ScrollArea>
        {/* <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" onClick={handleMapClick} className="h-8 w-8">
                <MapPin className="h-4 w-4 text-blue-600" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>View Map</p>
            </TooltipContent>
          </Tooltip>
          {loading && <p>Loading map data...</p>}
          {mapData && (
            <div className="mt-4">
              <h4 className="font-bold">Map Information:</h4>
              <pre>{JSON.stringify(mapData, null, 2)}</pre>
            </div>
          )}
        </TooltipProvider>
        
       
        <div className="border-t pt-4 mt-4">
          <h3 className="text-lg font-semibold mb-4">Continue the Conversation</h3>
          <Chat threadId={threadId} />
        </div> */}
      </div>
    </>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">View Prediction Results</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
          {DialogContentRender}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline">View Prediction Results</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle></DrawerTitle>
          <DrawerDescription>
            
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4 py-4">{DialogContentRender}</div>
        <DrawerFooter className="pt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

PredictionResult.propTypes = {
  predictionResult: PropTypes.shape({
    groundedPredictionOutput: PropTypes.string,
    threadId: PropTypes.string,
  }),
};

export default PredictionResult;