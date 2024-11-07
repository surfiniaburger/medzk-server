/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */

import {
  Card,
  CardHeader,
  CardTitle,
 
  CardContent,
} from "@/components/ui/card";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

const PredictionResults = ({ predictionResult }) => {
  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>Prediction Results</CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="border-b">
          {/* Diabetes */}
          <AccordionItem value="diabetes">
            <AccordionTrigger>Diabetes</AccordionTrigger>
            <AccordionContent>
              {predictionResult.groundedPredictionOutput.diabetes}
              {predictionResult.riskAssessments.diabetes && (
                <div className="mt-4">
                  <h4 className="font-medium">Risk Assessment:</h4>
                  <p>{predictionResult.riskAssessments.diabetes}</p>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* Heart Disease */}
          <AccordionItem value="heart-disease">
            <AccordionTrigger>Heart Disease</AccordionTrigger>
            <AccordionContent>
              {predictionResult.groundedPredictionOutput.heartDisease}
              {predictionResult.riskAssessments.heartDisease && (
                <div className="mt-4">
                  <h4 className="font-medium">Risk Assessment:</h4>
                  <p>{predictionResult.riskAssessments.heartDisease}</p>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* MS and Pregnancy-Related Complications */}
          <AccordionItem value="ms-complications">
            <AccordionTrigger>MS and Pregnancy-Related Complications</AccordionTrigger>
            <AccordionContent>
              {predictionResult.groundedPredictionOutput.msAndPregnancyComplications}
              {predictionResult.riskAssessments.msAndPregnancyComplications && (
                <div className="mt-4">
                  <h4 className="font-medium">Risk Assessment:</h4>
                  <p>{predictionResult.riskAssessments.msAndPregnancyComplications}</p>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* Mental Health */}
          <AccordionItem value="mental-health">
            <AccordionTrigger>Mental Health</AccordionTrigger>
            <AccordionContent>
              {predictionResult.groundedPredictionOutput.mentalHealth}
              {predictionResult.riskAssessments.mentalHealth && (
                <div className="mt-4">
                  <h4 className="font-medium">Risk Assessment:</h4>
                  <p>{predictionResult.riskAssessments.mentalHealth}</p>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* Social Determinants of Health (SDOH) */}
          <AccordionItem value="social-determinants">
            <AccordionTrigger>Social Determinants of Health (SDOH)</AccordionTrigger>
            <AccordionContent>
              {predictionResult.groundedPredictionOutput.socialDeterminants}
              {predictionResult.riskAssessments.socialDeterminants && (
                <div className="mt-4">
                  <h4 className="font-medium">Risk Assessment:</h4>
                  <p>{predictionResult.riskAssessments.socialDeterminants}</p>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default PredictionResults;