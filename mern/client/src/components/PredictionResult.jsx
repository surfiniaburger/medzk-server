/* eslint-disable react/no-children-prop */
import React from "react";
import PropTypes from "prop-types";
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

const predictionResultSchema = {
    predictionResult: PropTypes.shape({
        groundedPredictionOutput: PropTypes.shape({
            content: PropTypes.string,
            webSearchQueries: PropTypes.arrayOf(PropTypes.string),
        }),
    }),
};

function PredictionResult({ predictionResult }) {
    const [open, setOpen] = React.useState(false);
    const isDesktop = useMediaQuery("(min-width: 768px)");

    if (!predictionResult) return null;

    const { groundedPredictionOutput } = predictionResult;
    const { content, webSearchQueries } = groundedPredictionOutput || {};

    const handleSearchClick = (query) => {
        window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, "_blank");
    };

    const searchSuggestions = (
        <div className="mt-4">
            <h4 className="text-lg font-semibold">Search Suggestions</h4>
            <div className="flex flex-wrap gap-2 mt-2">
                {webSearchQueries?.map((query, index) => (
                    <button
                        key={index}
                        onClick={() => handleSearchClick(query)}
                        className="bg-gray-200 text-gray-700 px-3 py-1 rounded-md hover:bg-gray-300"
                    >
                        {query}
                    </button>
                ))}
            </div>
        </div>
    );

    const DialogContentRender = (
        <>
            <DialogHeader>
                <DialogTitle>Prediction Results</DialogTitle>
                <DialogDescription>
                    View the prediction results and insights below.
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
                <h4 className="text-lg font-semibold">Insights</h4>
                <ScrollArea className="max-h-64">
                    <ReactMarkdown
                        children={content || "No prediction available"}
                        remarkPlugins={[remarkGfm]}
                        className="prose prose-sm text-gray-600"
                    />
                </ScrollArea>
                {webSearchQueries && searchSuggestions}
            </div>
        </>
    );

    if (isDesktop) {
        return (
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline">View Prediction Results</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
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
                    <DrawerTitle>Prediction Results</DrawerTitle>
                    <DrawerDescription>
                        View the prediction results and insights below.
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

PredictionResult.propTypes = predictionResultSchema;

export default PredictionResult;
