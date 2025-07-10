
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { LabelForm } from './components/LabelForm';
import { LabelPreview } from './components/LabelPreview';
import { LabelData, LabelFormState, PlywoodType } from './types';
import { 
  REMEMBERED_LABELS_STORAGE_KEY,
  PRINT_FORMATS, 
  PrintFormat,
  ALL_DQ_VALUES, 
  ALL_DIMENSION_VALUES, 
  DQOption,
  INITIAL_LABEL_LAYOUT,
  LabelLayout,
  ElementStyle,
  SAVED_LAYOUTS_STORAGE_KEY,
  DEFAULT_LAYOUT_ID_STORAGE_KEY,
  SavedLabelLayout
} from './constants';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdfjs-dist/build/pdf.worker.mjs';

const HEADER_LOGO_URL = "https://i.ibb.co/twgXPHtC/logo-removebg-preview.png";
const LABEL_BACKGROUND_URL = "https://i.postimg.cc/hPtq0y0h/etykieta.png";

const initialFormState: LabelFormState = {
  thickness: '',
  dimension: '', 
  dq: '', 
  plywoodCode: '',
  type: PlywoodType.EXT, 
  quantity: '',
};

const CONTACT_DETAILS = {
  company: "Firma Handlowa Smętek Oddział Włocławek",
  address: "ul. Barska 12 Włocławek 87-800",
  phone: "Tel.: 54 411 19 16"
};

// Helper function to extract text from PDF
const extractTextFromPdf = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    fullText += textContent.items.map(item => ('str' in item ? item.str : '')).join(' ') + '\n';
  }
  return fullText;
};

interface ExtractedPdfLineItem {
  thickness: string; 
  dimension: string; 
  dq: string; 
  type: PlywoodType | ''; 
  quantityForDisplay: string; 
  numberOfLabels: number; 
}

// Helper function to normalize dimension strings (e.g., "1250 x 2500" -> "1250x2500")
const normalizeDimensionString = (dim: string): string => {
  return dim ? dim.replace(/\s+/g, '') : '';
};


const App: React.FC = () => {
  const [currentFormInputs, setCurrentFormInputs] = useState<LabelFormState>(initialFormState);
  const [generatedLabelData, setGeneratedLabelData] = useState<LabelData | null>(null);
  const [labelsToPrint, setLabelsToPrint] = useState<LabelData[]>([]);
  const [numCopies, setNumCopies] = useState<number>(2); 
  const [rememberedLabels, setRememberedLabels] = useState<LabelFormState[]>([]);
  const [activeRememberedLabelIndex, setActiveRememberedLabelIndex] = useState<number | null>(null);
  const [selectedPrintFormat, setSelectedPrintFormat] = useState<PrintFormat>(PRINT_FORMATS[0]);
  const [isPlywoodCodeManual, setIsPlywoodCodeManual] = useState<boolean>(false);
  const [isAnalyzingPdf, setIsAnalyzingPdf] = useState<boolean>(false);
  const [pdfAnalysisStatus, setPdfAnalysisStatus] = useState<string | null>(null); 
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [layout, setLayout] = useState<LabelLayout>(INITIAL_LABEL_LAYOUT);
  const [savedLayouts, setSavedLayouts] = useState<SavedLabelLayout[]>([]);
  const [selectedLayoutId, setSelectedLayoutId] = useState<string>('initial');
  const [defaultLayoutId, setDefaultLayoutId] = useState<string | null>(null);
  
  // State for the save layout modal
  const [isSaveLayoutModalOpen, setIsSaveLayoutModalOpen] = useState<boolean>(false);
  const [newLayoutName, setNewLayoutName] = useState<string>('');
  
  const printAspectRatio = useMemo(() => {
    const width = parseFloat(selectedPrintFormat.printWidth);
    const height = parseFloat(selectedPrintFormat.printHeight);
    if (isNaN(width) || isNaN(height) || height === 0) {
      return '4 / 3'; // A reasonable default aspect ratio
    }
    return `${width} / ${height}`;
  }, [selectedPrintFormat]);

  const ai = useMemo(() => {
    if (!process.env.API_KEY) {
      console.error("API_KEY environment variable not set.");
      return null;
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }, []);
  
  // Load layouts from localStorage on initial mount
  useEffect(() => {
    try {
      const storedLayouts = localStorage.getItem(SAVED_LAYOUTS_STORAGE_KEY);
      const parsedLayouts = storedLayouts ? (JSON.parse(storedLayouts) as SavedLabelLayout[]) : [];
      if (Array.isArray(parsedLayouts)) {
          setSavedLayouts(parsedLayouts);
      }

      const storedDefaultId = localStorage.getItem(DEFAULT_LAYOUT_ID_STORAGE_KEY);
      if (storedDefaultId) {
          setDefaultLayoutId(storedDefaultId);
          const defaultLayout = parsedLayouts.find(l => l.id === storedDefaultId);
          if (defaultLayout) {
              setLayout(JSON.parse(JSON.stringify(defaultLayout.layout)));
              setSelectedLayoutId(defaultLayout.id);
          }
      }
    } catch (e) {
      console.error("Failed to load layouts from localStorage", e);
    }
  }, []);
  
  // Persist saved layouts to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(SAVED_LAYOUTS_STORAGE_KEY, JSON.stringify(savedLayouts));
    } catch (e) {
      console.error("Failed to save layouts to localStorage", e);
    }
  }, [savedLayouts]);
  
  // Persist default layout ID to localStorage
  useEffect(() => {
    try {
      if (defaultLayoutId) {
        localStorage.setItem(DEFAULT_LAYOUT_ID_STORAGE_KEY, defaultLayoutId);
      } else {
        localStorage.removeItem(DEFAULT_LAYOUT_ID_STORAGE_KEY);
      }
    } catch (e) {
      console.error("Failed to save default layout ID to localStorage", e);
    }
  }, [defaultLayoutId]);


  const handleLayoutChange = useCallback((elementId: keyof LabelLayout, newStyle: ElementStyle) => {
    setLayout(prevLayout => ({
      ...prevLayout,
      [elementId]: newStyle,
    }));
  }, []);

  const openSaveLayoutModal = () => {
    setNewLayoutName('');
    setIsSaveLayoutModalOpen(true);
  };

  const handleConfirmSaveLayout = () => {
    if (!newLayoutName.trim()) {
      alert("Please enter a name for the layout.");
      return;
    }

    const newLayoutToSave: SavedLabelLayout = {
      id: Date.now().toString(),
      name: newLayoutName.trim(),
      layout: JSON.parse(JSON.stringify(layout)), // Deep copy the current layout from state
    };

    setSavedLayouts(prev => [...prev, newLayoutToSave]);
    setSelectedLayoutId(newLayoutToSave.id);
    setIsSaveLayoutModalOpen(false);
    setNewLayoutName('');
    alert(`Layout "${newLayoutToSave.name}" saved!`);
  };
  
  const handleSelectLayout = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedLayoutId(id);
    if (id === 'initial') {
      setLayout(JSON.parse(JSON.stringify(INITIAL_LABEL_LAYOUT)));
    } else {
      const selected = savedLayouts.find(l => l.id === id);
      if (selected) {
        setLayout(JSON.parse(JSON.stringify(selected.layout)));
      }
    }
  };

  const handleSetAsDefault = () => {
    if (selectedLayoutId && selectedLayoutId !== 'initial') {
      setDefaultLayoutId(selectedLayoutId);
      alert(`Layout "${savedLayouts.find(l=>l.id===selectedLayoutId)?.name}" is now the default.`);
    } else {
       alert("Please select a saved layout to set as default.");
    }
  };

  const handleDeleteLayout = () => {
    if (selectedLayoutId && selectedLayoutId !== 'initial') {
       if (confirm(`Are you sure you want to delete the layout "${savedLayouts.find(l=>l.id===selectedLayoutId)?.name}"?`)) {
          setSavedLayouts(prev => prev.filter(l => l.id !== selectedLayoutId));
          if (defaultLayoutId === selectedLayoutId) {
            setDefaultLayoutId(null);
          }
          setSelectedLayoutId('initial');
          setLayout(JSON.parse(JSON.stringify(INITIAL_LABEL_LAYOUT)));
       }
    } else {
       alert("Please select a saved layout to delete.");
    }
  };


  useEffect(() => {
    document.documentElement.style.setProperty('--print-label-width', selectedPrintFormat.printWidth);
    document.documentElement.style.setProperty('--print-label-height', selectedPrintFormat.printHeight);
  }, [selectedPrintFormat]);

  useEffect(() => {
    const storedLabels = localStorage.getItem(REMEMBERED_LABELS_STORAGE_KEY);
    if (storedLabels) {
      try {
        const parsedLabels = JSON.parse(storedLabels);
        if (Array.isArray(parsedLabels)) {
          setRememberedLabels(parsedLabels);
        }
      } catch (error) {
        console.error("Failed to parse remembered labels from localStorage:", error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(REMEMBERED_LABELS_STORAGE_KEY, JSON.stringify(rememberedLabels));
  }, [rememberedLabels]);

  const sortedRememberedLabels = useMemo(() => {
    return [...rememberedLabels].sort((a, b) => {
      const typeA = a.type || '';
      const typeB = b.type || '';
      if (typeA < typeB) return -1;
      if (typeA > typeB) return 1;
      
      const thicknessA = parseFloat(a.thickness);
      const thicknessB = parseFloat(b.thickness);
      if (isNaN(thicknessA) && isNaN(thicknessB)) return 0;
      if (isNaN(thicknessA)) return 1; 
      if (isNaN(thicknessB)) return -1;
      return thicknessA - thicknessB;
    });
  }, [rememberedLabels]);

  const handleFormInputChange = useCallback((fieldName: keyof LabelFormState, value: string | PlywoodType) => {
    let processedValue = value;
    if (fieldName === 'dimension' && typeof value === 'string') {
      processedValue = normalizeDimensionString(value);
    }

    setCurrentFormInputs(prev => ({ ...prev, [fieldName]: processedValue }));
    setGeneratedLabelData(null); 
    setPdfAnalysisStatus(null); 
    
    const isDirectPlywoodCodeEdit = fieldName === 'plywoodCode' && 
                                   (document.activeElement as HTMLElement)?.id === 'plywoodCode';

    if (activeRememberedLabelIndex !== null && (fieldName !== 'plywoodCode' || isDirectPlywoodCodeEdit)) {
       setActiveRememberedLabelIndex(null);
    }

    if (fieldName === 'plywoodCode' && isDirectPlywoodCodeEdit) {
        setIsPlywoodCodeManual(true);
    }

  }, [activeRememberedLabelIndex]);

  const handlePlywoodCodeManualChange = (manual: boolean) => {
    setIsPlywoodCodeManual(manual);
    if (!manual) {
        const { thickness, dq, dimension } = currentFormInputs; 
        if (thickness && dq && dimension) {
            const selectedDimensionObj = ALL_DIMENSION_VALUES.find(d => d.value === dimension); // dimension is already normalized
            const dimensionPart = selectedDimensionObj?.code || dimension;

            const selectedDQObj = ALL_DQ_VALUES.find(option => 
                option.value.toLowerCase() === dq.toLowerCase() ||
                option.display.toLowerCase() === dq.toLowerCase()
            );
            const dqPart = selectedDQObj?.value || dq;

            const newPlywoodCode = `${thickness.replace(',', '.')}/${dqPart}/${dimensionPart}`;
            if (currentFormInputs.plywoodCode !== newPlywoodCode) {
                 setCurrentFormInputs(prev => ({ ...prev, plywoodCode: newPlywoodCode }));
            }
        } else {
             setCurrentFormInputs(prev => ({ ...prev, plywoodCode: '' }));
        }
    }
  };

  const extractPlywoodDataFromText = async (text: string, dqOptions: DQOption[]): Promise<ExtractedPdfLineItem[]> => {
    if (!ai) {
      throw new Error("Gemini AI client not initialized. Check API_KEY.");
    }

    const dqOptionsString = JSON.stringify(dqOptions.map(opt => ({ display: opt.display, value: opt.value })));

    const prompt = `
      You are an assistant that extracts specific information from plywood order documents.
      The document contains a table of line items. For each line item, you need to extract the following details:

      1.  Plywood Thickness: From a "Thickness" column (numeric value only, e.g., "18").
      2.  Dimension: Combine "Width" and "Length" columns into "WIDTHxLENGTH" format (e.g., "1250x2500"). Ensure no extra spaces.
      3.  Plywood DQ/Quality (dq):
          *   Read the quality text from the PDF's "Quality" column (e.g., "F1/W1", "BB/CP").
          *   You are provided with a list of known DQ options: ${dqOptionsString}. This list contains objects with "display" (textual representation) and "value" (code) fields.
          *   Match the extracted quality text (or its close variant, e.g., "F1/W1" for "F/W I") to a "display" field in the provided DQ options.
          *   If a match is found, use the corresponding "value" (DQ code) for the "dq" field in your output (e.g., if PDF says "B/BB", use code "02").
          *   If no confident match is found, use the original quality text from the PDF for the "dq" field.
      4.  Plywood Type (type): Look for "EXT" or "MR". If not clearly identifiable, return an empty string "".
      5.  Quantity for Display (quantityForDisplay): From a "Pieces per pack" or similar column. Format as a string like "X pcs" or "X sheets" (e.g., "50 pcs").
      6.  Number of Labels (numberOfLabels): From a "Packs" or similar column (integer representing how many packs/labels of this item).

      Return the extracted information as a JSON array, where each object in the array represents one line item.
      Each object should have the keys: "thickness", "dimension", "dq", "type", "quantityForDisplay", "numberOfLabels".
      If a specific piece of information for an item is not found or cannot be reliably extracted:
        - For "thickness", "dimension", "dq", "quantityForDisplay": use an empty string "".
        - For "type": use "" if not EXT/MR.
        - For "numberOfLabels": use 1 if not found or invalid.

      Do not add any explanations or markdown formatting around the JSON array. Ensure the output is ONLY the JSON array.

      Document Text:
      ---
      ${text}
      ---
    `;
    
    let jsonStr = ""; 

    try {
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt, 
        config: {
          responseMimeType: "application/json"
        }
      });
      jsonStr = response.text.trim();

      try {
        const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
        const match = jsonStr.match(fenceRegex);
        if (match && match[2]) {
          jsonStr = match[2].trim(); 
        }
        
        let parsedResponse = JSON.parse(jsonStr);

        if (!Array.isArray(parsedResponse)) {
          console.warn("Gemini response was not an array as expected, attempting to adapt:", parsedResponse);
          if (typeof parsedResponse === 'object' && parsedResponse !== null) {
            if ('thickness' in parsedResponse || 'dimension' in parsedResponse) {
              parsedResponse = [parsedResponse];
            } else {
              throw new Error("AI response was not in the expected array format and does not appear to be a single item object.");
            }
          } else {
            throw new Error("AI response was not in the expected array format for line items.");
          }
        }
        
        const parsedDataArray = parsedResponse as Partial<ExtractedPdfLineItem>[];
        const validatedDataArray: ExtractedPdfLineItem[] = [];

        for (const parsedItem of parsedDataArray) {
          const validatedItem: ExtractedPdfLineItem = {
            thickness: (typeof parsedItem.thickness === 'string' ? parsedItem.thickness : "").trim(),
            dimension: (typeof parsedItem.dimension === 'string' ? parsedItem.dimension : "").trim(), // Normalization happens later
            dq: (typeof parsedItem.dq === 'string' ? parsedItem.dq : "").trim(),
            type: (parsedItem.type === PlywoodType.EXT || parsedItem.type === PlywoodType.MR) ? parsedItem.type : '',
            quantityForDisplay: (typeof parsedItem.quantityForDisplay === 'string' ? parsedItem.quantityForDisplay : "").trim(),
            numberOfLabels: (typeof parsedItem.numberOfLabels === 'number' && !isNaN(parsedItem.numberOfLabels) && parsedItem.numberOfLabels > 0) ? Math.floor(parsedItem.numberOfLabels) : 1,
          };
          
          if (validatedItem.numberOfLabels === 0 && validatedItem.quantityForDisplay) {
              validatedItem.numberOfLabels = 1;
          }
          validatedDataArray.push(validatedItem);
        }
        return validatedDataArray;

      } catch (parseError) {
        console.error("Error parsing Gemini JSON response:", parseError);
        let errorMessage = "Failed to parse AI response.";
        if (parseError instanceof Error) {
          errorMessage += ` Details: ${parseError.message}.`;
        }
        errorMessage += ` Raw AI response that caused parsing error: "${jsonStr}"`;
        throw new Error(errorMessage);
      }

    } catch (apiError) { 
      console.error("Error calling Gemini API:", apiError);
      let errorMessage = "Failed to get data from AI.";
      if (apiError instanceof Error) {
        errorMessage += ` Details: ${apiError.message}`;
      }
      if (jsonStr) {
         errorMessage += ` Last known raw response attempt: "${jsonStr}"`;
      }
      throw new Error(errorMessage);
    }
  };

  const handleAnalyzePdf = async (file: File) => {
    setIsAnalyzingPdf(true);
    setPdfAnalysisStatus(null);
    setGeneratedLabelData(null); 

    try {
      const text = await extractTextFromPdf(file);
      if (!text.trim()) {
        throw new Error("No text could be extracted from the PDF.");
      }
      
      const extractedLineItemsRaw = await extractPlywoodDataFromText(text, ALL_DQ_VALUES);

      const extractedLineItems = extractedLineItemsRaw.map(item => ({
        ...item,
        dimension: normalizeDimensionString(item.dimension) 
      }));
      
      if (extractedLineItems.length === 0) {
        setPdfAnalysisStatus("No line items could be extracted from the PDF. Please check the document content or try manual entry.");
        setIsAnalyzingPdf(false);
        return;
      }

      const newLabels: LabelData[] = [];
      const currentDate = new Date().toLocaleDateString('pl-PL', {
        year: 'numeric', month: '2-digit', day: '2-digit'
      });

      const firstItem = extractedLineItems[0];
      
      let typeForFormDisplay: PlywoodType | '' = PlywoodType.EXT; 
      if (firstItem.type) {
        typeForFormDisplay = firstItem.type;
      } else if (currentFormInputs.type) { 
        typeForFormDisplay = currentFormInputs.type;
      } 

      const firstItemFormStateUpdate: LabelFormState = {
        thickness: firstItem.thickness,
        dimension: firstItem.dimension, // Already normalized
        dq: firstItem.dq,
        plywoodCode: '', 
        quantity: firstItem.quantityForDisplay,
        type: typeForFormDisplay,
      };
      
      if (firstItemFormStateUpdate.thickness && firstItemFormStateUpdate.dq && firstItemFormStateUpdate.dimension) {
          const dimObj = ALL_DIMENSION_VALUES.find(d => d.value === firstItemFormStateUpdate.dimension);
          const dimPart = dimObj?.code || firstItemFormStateUpdate.dimension;
          
          const selectedDQObj = ALL_DQ_VALUES.find(option => 
            option.value.toLowerCase() === firstItemFormStateUpdate.dq.toLowerCase() ||
            option.display.toLowerCase() === firstItemFormStateUpdate.dq.toLowerCase()
          );
          const dqPart = selectedDQObj?.value || firstItemFormStateUpdate.dq;

          firstItemFormStateUpdate.plywoodCode = `${firstItemFormStateUpdate.thickness.replace(',', '.')}/${dqPart}/${dimPart}`;
      }
      setCurrentFormInputs(firstItemFormStateUpdate);
      setIsPlywoodCodeManual(false); 

      let anyTypeMissingInPdf = false;

      for (const item of extractedLineItems) {
        const resolvedItemTypeForQueue = item.type || firstItemFormStateUpdate.type; 
        
        if (!item.type) { 
            anyTypeMissingInPdf = true;
        }

        let currentItemPlywoodCode = '';
        if (item.thickness && item.dq && item.dimension) { 
            const dimensionObj = ALL_DIMENSION_VALUES.find(d => d.value === item.dimension); // item.dimension is normalized
            const dimensionPart = dimensionObj?.code || item.dimension; 

            const selectedDQObjLoop = ALL_DQ_VALUES.find(option => 
              option.value.toLowerCase() === item.dq.toLowerCase() ||
              option.display.toLowerCase() === item.dq.toLowerCase()
            );
            const dqPartLoop = selectedDQObjLoop?.value || item.dq;
            
            currentItemPlywoodCode = `${item.thickness.replace(',', '.')}/${dqPartLoop}/${dimensionPart}`;
        }

        if (item.numberOfLabels > 0 && resolvedItemTypeForQueue) { 
          for (let i = 0; i < item.numberOfLabels; i++) {
            newLabels.push({
              thickness: item.thickness.replace(',', '.'),
              dimension: item.dimension, // Already normalized
              dq: item.dq, 
              plywoodCode: currentItemPlywoodCode,
              type: resolvedItemTypeForQueue as PlywoodType, 
              quantity: item.quantityForDisplay, 
              date: currentDate,
            });
          }
        } else if (item.numberOfLabels > 0 && !resolvedItemTypeForQueue) {
             console.warn("Skipping label generation for an item due to unresolved empty type:", item);
        }
      }
      
      if (newLabels.length > 0) {
        setLabelsToPrint(prev => [...prev, ...newLabels]);
        let statusMsg = `${newLabels.length} label(s) from ${extractedLineItems.length} PDF item(s) added to the print queue.`;
        if (anyTypeMissingInPdf) { 
             statusMsg += ` Plywood Type for items not specified in the PDF was set to '${firstItemFormStateUpdate.type}'. Please verify.`;
        }
        statusMsg += " Please verify DQ values; they were mapped where possible using the full DQ list."
        setPdfAnalysisStatus(statusMsg);
        setGeneratedLabelData(null); 
      } else if (extractedLineItems.length > 0 && newLabels.length === 0) {
        setPdfAnalysisStatus(`PDF analyzed with ${extractedLineItems.length} item(s). No labels were added to the queue. This could be due to missing critical data (like Plywood Type, thickness, dimension, DQ, or quantity) for all extracted items, or if all items had zero packs. The form has been populated with the first item's details for review.`);
      } else {
         setPdfAnalysisStatus("PDF analyzed. Form populated with first item. No specific number of labels determined or essential data like Type missing.");
      }
      setActiveRememberedLabelIndex(null);

    } catch (error) {
      console.error("PDF Analysis Error:", error);
      let message = "An unknown error occurred during PDF analysis.";
      if (error instanceof Error) {
        message = error.message;
      }
      setPdfAnalysisStatus(message);
    } finally {
      setIsAnalyzingPdf(false);
    }
  };


  const handleGenerateLabel = useCallback((formData: LabelFormState, remember: boolean) => {
    if (formData.type === '') {
      alert("Please select a Plywood Type before generating a label.");
      return;
    }
    const currentDate = new Date().toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const newLabelData = {
      ...formData,  // formData.dimension is already normalized
      thickness: formData.thickness.replace(',', '.'), 
      type: formData.type as PlywoodType, 
      date: currentDate,
    };
    setGeneratedLabelData(newLabelData);
    setPdfAnalysisStatus(null); 

    if (remember) {
      const rememberableFormData = {...formData}; // formData.dimension is already normalized
      const isDuplicate = rememberedLabels.some(
        label => JSON.stringify(label) === JSON.stringify(rememberableFormData)
      );
      if (!isDuplicate) {
        setRememberedLabels(prevLabels => [...prevLabels, rememberableFormData]);
      }
    }
  }, [rememberedLabels]);
  
  const handleSelectDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedIndexStr = e.target.value;
    setGeneratedLabelData(null); 
    setPdfAnalysisStatus(null);
    if (selectedIndexStr === "") { 
      setActiveRememberedLabelIndex(null);
      setCurrentFormInputs(initialFormState); 
      setIsPlywoodCodeManual(false);
    } else {
      const selectedIndex = parseInt(selectedIndexStr, 10);
      if (!isNaN(selectedIndex) && sortedRememberedLabels[selectedIndex]) {
        setActiveRememberedLabelIndex(selectedIndex);
        const selectedFormData = sortedRememberedLabels[selectedIndex]; // dimension here is already normalized
        setCurrentFormInputs({
            ...selectedFormData,
            type: selectedFormData.type || PlywoodType.EXT, 
        });
        setIsPlywoodCodeManual(true); 
      }
    }
  };

  const handleDeleteSelectedRememberedLabel = () => {
    if (activeRememberedLabelIndex !== null && sortedRememberedLabels[activeRememberedLabelIndex]) {
      const labelToDelete = sortedRememberedLabels[activeRememberedLabelIndex];
      const stringifiedLabelToDelete = JSON.stringify(labelToDelete);
      
      setRememberedLabels(prevLabels => 
        prevLabels.filter(label => JSON.stringify(label) !== stringifiedLabelToDelete)
      );
      
      setActiveRememberedLabelIndex(null);
      setCurrentFormInputs(initialFormState);
      setGeneratedLabelData(null);
      setIsPlywoodCodeManual(false);
      setPdfAnalysisStatus(null);
    }
  };

  const handlePrintFormatChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const formatName = e.target.value;
    const newFormat = PRINT_FORMATS.find(f => f.name === formatName);
    if (newFormat) {
      setSelectedPrintFormat(newFormat);
    }
  };

  const getDQDisplayText = (dqValue: string): string => {
    const dqOption = ALL_DQ_VALUES.find(option => 
        option.value.toLowerCase() === dqValue.toLowerCase() || 
        option.display.toLowerCase() === dqValue.toLowerCase()
    );
    return dqOption ? dqOption.display : dqValue;
  };

  const handleAddLabelToPrintQueue = () => {
    if (generatedLabelData) {
      setLabelsToPrint(prev => [...prev, generatedLabelData]);
      setGeneratedLabelData(null); 
      setPdfAnalysisStatus(null);
    } else {
      alert("Generate a label first before adding to queue.")
    }
  };

  const handleRemoveLabelFromPrintQueue = (indexToRemove: number) => {
    setLabelsToPrint(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleResetAll = () => {
    setCurrentFormInputs(initialFormState);
    setGeneratedLabelData(null);
    setLabelsToPrint([]);
    setNumCopies(2);
    setSelectedPrintFormat(PRINT_FORMATS[0]);
    setActiveRememberedLabelIndex(null);
    setIsPlywoodCodeManual(false);
    setPdfAnalysisStatus(null);
    // Reset layout controls
    setLayout(INITIAL_LABEL_LAYOUT);
    setIsEditMode(false);
    setSelectedLayoutId('initial');
    setDefaultLayoutId(null);
    // Optionally clear saved layouts, but this might be too destructive.
    // if(confirm("Do you also want to delete all saved layouts?")) {
    //   setSavedLayouts([]);
    // }
  };
  
  const getLabelInstanceStyles = (currentLayout: LabelLayout) => {
    let elementStyles = '';
    // Generate styles for each editable element based on the current layout state
    for (const key in currentLayout) {
        const style = currentLayout[key as keyof LabelLayout];
        // CSS class name is derived from the layout key (e.g., 'plywoodCode' -> '.label-plywoodcode')
        elementStyles += `
            .label-${key.toLowerCase()} {
                position: absolute;
                left: ${style.x}%;
                top: ${style.y}%;
                font-size: ${style.fontSize}pt;
                transform: translate(-50%, -50%);
                line-height: 1;
                margin: 0;
                padding: 0;
                white-space: nowrap;
                color: black !important;
                text-align: center;
                font-family: Arial, sans-serif;
                font-weight: ${['thickness', 'dimension', 'dq', 'quantity', 'type'].includes(key) ? 'bold' : 'normal'};
            }
        `;
    }

    return `
      .label-instance {
        width: var(--label-instance-width, ${selectedPrintFormat.printWidth}); 
        height: var(--label-instance-height, ${selectedPrintFormat.printHeight}); 
        background-image: url('${LABEL_BACKGROUND_URL}');
        background-size: 100% 100%;
        background-repeat: no-repeat;
        box-sizing: border-box;
        overflow: hidden;
        position: relative;
        font-family: Arial, sans-serif;
      }
      /* Unset old flex/grid styles from containers that are no longer used for positioning */
      .quantity-container, .type-container, .label-main-details, .label-bottom-section, .label-footer-info {
          all: unset;
          display: contents; 
      }
      ${elementStyles}
    `;
  };

  const generateHtmlForOneA4PageContent = async (
    labelData: LabelData, 
    numInstancesOnPage: 1 | 2, 
    contactDetails: typeof CONTACT_DETAILS
  ): Promise<string> => {
    const dqDisplay = getDQDisplayText(labelData.dq);
    
    let instancesHtml = '';

    const labelContentHtml = `
      <p class="label-thickness">${labelData.thickness}mm</p>
      <p class="label-dimension">${labelData.dimension}</p>
      <p class="label-dq">${dqDisplay}</p>
      <p class="label-plywoodcode">Plywood Code: ${labelData.plywoodCode}</p>
      <span class="label-quantitylabel">Quantity:</span>
      <p class="label-quantity">${labelData.quantity}</p>
      <span class="label-typelabel">Type:</span>
      <p class="label-type">${labelData.type}</p>
      <div class="label-footer">
        <p>${labelData.date} - ${contactDetails.company}, ${contactDetails.address}, ${contactDetails.phone}</p>
      </div>
    `;

    for (let i = 0; i < numInstancesOnPage; i++) {
      instancesHtml += `<div class="label-instance">${labelContentHtml}</div>`;
    }
    return instancesHtml;
  };

  const openPrintWindowWithHtml = (htmlContent: string) => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();

      setTimeout(() => {
        printWindow.focus(); 
        printWindow.print();
      }, 750); 
    } else {
      alert("Failed to open print window. Check browser pop-up blocker settings.");
    }
  };
  
  const handlePrintSingleLabel = async (labelToPrint: LabelData) => {
    if (!labelToPrint) return;
    try {
      const numInstancesPerSheet = numCopies >= 2 ? 2 : 1;
      const pageContent = await generateHtmlForOneA4PageContent(labelToPrint, numInstancesPerSheet, CONTACT_DETAILS);
      
      const fullPrintHtml = `
        <html>
          <head>
            <title>Print Label</title>
            <style>
              @page {
                size: A4 portrait;
                margin: 5mm;
              }
              body {
                margin: 0;
                padding: 0;
                font-family: Arial, sans-serif;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .print-container { 
                width: 100%; 
                height: calc(100vh - 10mm); 
                display: flex;
                flex-direction: column;
                justify-content: ${numInstancesPerSheet === 1 ? 'center' : 'space-around'};
                align-items: center;
                box-sizing: border-box;
              }
              ${getLabelInstanceStyles(layout)}
            </style>
          </head>
          <body>
            <div class="print-container">${pageContent}</div>
          </body>
        </html>
      `;
      openPrintWindowWithHtml(fullPrintHtml);
    } catch (error) {
      console.error("Error during single label printing:", error);
      alert("An error occurred while trying to print the label. Check console for details.");
    }
  };

  const handlePrintAllQueued = async () => { 
    if (labelsToPrint.length === 0) {
      alert("Print queue is empty. Add labels to the queue first.");
      return;
    }

    try {
      let allPagesHtmlContent = '';
      const numInstancesPerSheet = numCopies >= 2 ? 2 : 1;

      for (let i = 0; i < labelsToPrint.length; i++) {
        const label = labelsToPrint[i];
        const innerPageContent = await generateHtmlForOneA4PageContent(label, numInstancesPerSheet, CONTACT_DETAILS);
        const isLastPage = i === labelsToPrint.length - 1;
        
        allPagesHtmlContent += `
          <div 
            class="print-container" 
            ${isLastPage ? '' : 'style="page-break-after: always;"'}
          >
            ${innerPageContent}
          </div>
        `;
      }
      
      const fullPrintHtml = `
        <html>
          <head>
            <title>Print All Labels</title>
            <style>
              @page {
                size: A4 portrait;
                margin: 5mm;
              }
              body {
                margin: 0;
                padding: 0;
                font-family: Arial, sans-serif;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .print-container { 
                width: 100%; 
                height: calc(100vh - 10mm); 
                display: flex;
                flex-direction: column;
                justify-content: ${numInstancesPerSheet === 1 ? 'center' : 'space-around'};
                align-items: center;
                box-sizing: border-box;
              }
              ${getLabelInstanceStyles(layout)}
            </style>
          </head>
          <body>
            ${allPagesHtmlContent}
          </body>
        </html>
      `;
      openPrintWindowWithHtml(fullPrintHtml);
    } catch (error) { 
      console.error("Error during batch printing:", error);
      alert("An error occurred while trying to print all labels. Check console for details.");
    }
  };

  const handlePrintQueueList = () => {
    if (labelsToPrint.length === 0) {
      alert("Print queue is empty. Add labels to the queue first to print a list.");
      return;
    }

    const listItems = labelsToPrint.map((label, index) => {
      const dqDisplay = getDQDisplayText(label.dq); // label.dq from queue is the original input
      return `<li>
        <div class="item-number">${index + 1}.</div>
        <div class="item-content">
          <div class="details-line">
            <span class="details-line-key">Grubość i Wymiar:</span>
            <span class="details-value">${label.thickness}mm x ${label.dimension}</span>
          </div>
          <div class="other-info-line">
            <span class="info-segment"><span class="label-key">DQ:</span> ${dqDisplay}</span>
            <span class="info-segment"><span class="label-key">Kod:</span> ${label.plywoodCode}</span>
            <span class="info-segment"><span class="label-key">Typ:</span> ${label.type}</span>
            <span class="info-segment"><span class="label-key">Ilość:</span> ${label.quantity}</span>
          </div>
        </div>
      </li>`;
    }).join('');

    const htmlContent = `
      <html>
        <head>
          <title>Print Queue Verification List</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              color: #333; 
              font-size: 14pt; 
            }
            h1 { 
              font-size: 18pt; 
              margin-bottom: 10px; 
              color: #111; 
            }
            p.meta-info { 
              font-size: 12pt; 
              margin-bottom: 15px; 
              color: #555;
            }
            ul { list-style-type: none; padding-left: 0; }
            li { 
              display: flex;
              align-items: flex-start;
              padding: 8px 0; 
              border-bottom: 1px solid #ddd; 
              font-size: 14pt; 
              line-height: 1.5;
              page-break-inside: avoid; 
            }
            li:last-child { border-bottom: none; }
            
            .item-number {
              font-weight: normal;
              margin-right: 10px; 
              min-width: 1.5em; 
              padding-top: 0.1em; 
            }
            .item-content {
              flex-grow: 1;
            }

            .details-line {
              margin-bottom: 6px;
            }
            .details-line-key {
              font-weight: bold;
              font-size: 1em; 
              margin-right: 0.5em;
            }
            .details-value {
              font-size: 1.285em; 
              font-weight: 600; 
            }

            .other-info-line {
              line-height: 1.4;
            }
            .other-info-line .info-segment {
              display: inline-block;
              margin-right: 1em; 
              margin-bottom: 0.3em;
            }
            .other-info-line .info-segment:last-child {
              margin-right: 0;
            }
            .other-info-line .label-key { 
              font-weight: bold;
            }

            .print-button { 
              display: block; 
              margin: 30px auto 15px; 
              padding: 12px 20px; 
              font-size: 1em; 
              color: white; 
              background-color: #007bff; 
              border: none; 
              border-radius: 5px; 
              cursor: pointer;
            }

            @media print {
              body { 
                margin: 10mm; 
                font-size: 14pt; 
                color: black !important; 
              }
              h1 { font-size: 18pt; }
              p.meta-info { 
                font-size: 12pt; 
                margin-bottom: 15px; 
              }
              li { 
                font-size: 14pt; 
                padding: 7px 0; 
                border-color: #ccc; 
              }
              .label-key, .details-line-key { color: black !important; }
              .print-button { display: none; }
              * {
                color-adjust: exact !important;
                -webkit-print-color-adjust: exact !important;
              }
            }
          </style>
        </head>
        <body>
          <h1>Plywood Label Queue - Verification List</h1>
          <p class="meta-info">Generated on: ${new Date().toLocaleString('pl-PL')} | Total labels in queue: ${labelsToPrint.length}</p>
          <ul>
            ${listItems}
          </ul>
          <button class="print-button" onclick="window.print()">Print This List</button>
        </body>
      </html>
    `;
    openPrintWindowWithHtml(htmlContent);
  };


  return (
    <div className="min-h-screen flex flex-col items-center py-8 px-4">
      <header className="mb-8 text-center no-print">
        <img src={HEADER_LOGO_URL} alt="Logo" className="mx-auto h-24" />
      </header>

      <main className="w-full max-w-5xl flex flex-col lg:flex-row gap-8">
        <div className="lg:w-1/3 p-6 rounded-lg shadow-xl no-print space-y-8 bg-slate-800 bg-opacity-50 backdrop-blur-sm">
          <LabelForm
            plywoodTypes={Object.values(PlywoodType)}
            formData={currentFormInputs}
            onInputChange={handleFormInputChange}
            onGenerate={handleGenerateLabel}
            onAnalyzePdfRequest={handleAnalyzePdf}
            isAnalyzingPdf={isAnalyzingPdf}
            pdfAnalysisStatus={pdfAnalysisStatus} 
            isPlywoodCodeManual={isPlywoodCodeManual}
            onPlywoodCodeManualChange={handlePlywoodCodeManualChange}
          />
          {rememberedLabels.length > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-600">
              <h3 className="text-xl font-semibold text-gray-100 mb-2">Remembered Labels:</h3>
              <label htmlFor="remembered-labels-select" className="sr-only">Select remembered label</label>
              <select
                id="remembered-labels-select"
                value={activeRememberedLabelIndex !== null ? activeRememberedLabelIndex.toString() : ""}
                onChange={handleSelectDropdownChange}
                className="mt-1 block w-full pl-3 pr-10 py-2.5 text-base border-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-slate-700 text-gray-200 hover:bg-slate-600 transition-colors"
                aria-label="Select a remembered label from the list"
              >
                <option value="">-- Select Remembered Label --</option>
                {sortedRememberedLabels.map((label, index) => (
                  <option key={index} value={index.toString()}>
                    {`${label.type || PlywoodType.EXT} - ${label.thickness || 'N/A'}mm x ${label.dimension || 'N/A'} | DQ: ${getDQDisplayText(label.dq) || 'N/A'} | Code: ${label.plywoodCode || 'N/A'} | Qty: ${label.quantity || 'N/A'}`}
                  </option>
                ))}
              </select>
              
              {activeRememberedLabelIndex !== null && (
                <button
                  onClick={handleDeleteSelectedRememberedLabel}
                  className="mt-4 w-full py-2 px-4 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-800"
                  aria-label="Delete selected remembered label"
                >
                  Delete Selected Label
                </button>
              )}
            </div>
          )}
        </div>

        <div className="lg:w-2/3 flex flex-col items-center">
          {generatedLabelData ? (
            <div
              className="mb-2 w-full"
              style={{
                maxWidth: selectedPrintFormat.screenWidth,
                width: '100%',
                aspectRatio: printAspectRatio,
              }}
              aria-live="polite"
            >
              <LabelPreview
                labelData={generatedLabelData}
                contactDetails={CONTACT_DETAILS}
                isEditMode={isEditMode}
                layout={layout}
                onLayoutChange={handleLayoutChange}
              />
            </div>
          ) : labelsToPrint.length === 0 && (
            <div
              className="flex justify-center items-center rounded-lg text-slate-400 text-center p-10 bg-slate-800 bg-opacity-30 w-full"
              style={{
                maxWidth: selectedPrintFormat.screenWidth,
                width: '100%',
                aspectRatio: printAspectRatio,
                backgroundImage: `url('${LABEL_BACKGROUND_URL}')`,
                backgroundSize: '100% 100%',
                backgroundPosition: 'center',
                borderColor: '#1B313F'
              }}
              aria-label="Label preview - fill form to generate or analyze PDF"
            >
            </div>
          )}
          
          <div className="p-4 rounded-lg shadow-md w-full no-print bg-slate-800 bg-opacity-50 backdrop-blur-sm space-y-4" style={{ maxWidth: selectedPrintFormat.screenWidth }}>
            <div className="flex items-center gap-4">
              <input 
                type="checkbox" 
                id="edit-mode-toggle" 
                checked={isEditMode} 
                onChange={(e) => setIsEditMode(e.target.checked)} 
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" 
              />
              <label htmlFor="edit-mode-toggle" className="text-gray-200">Edit Layout</label>
            </div>

            {isEditMode && (
              <div className="flex flex-wrap items-center gap-3">
                <button 
                  onClick={() => setLayout(JSON.parse(JSON.stringify(INITIAL_LABEL_LAYOUT)))}
                  className="py-1 px-3 text-xs font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  Reset Layout
                </button>
                <button 
                  onClick={openSaveLayoutModal}
                  className="py-1 px-3 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  Save Layout
                </button>
              </div>
            )}
            
            <div className="space-y-2">
              <label htmlFor="layout-select" className="text-sm font-medium text-gray-200">
                Active Layout
              </label>
              <select 
                id="layout-select" 
                value={selectedLayoutId} 
                onChange={handleSelectLayout}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-slate-700 text-gray-200 hover:bg-slate-600 transition-colors"
              >
                <option value="initial">Default Initial Layout</option>
                {savedLayouts.map(l => (
                  <option key={l.id} value={l.id}>{l.name} {l.id === defaultLayoutId ? '(Default)' : ''}</option>
                ))}
              </select>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <button 
                  onClick={handleSetAsDefault}
                  disabled={!selectedLayoutId || selectedLayoutId === 'initial'}
                  className="py-1 px-3 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Set as Default
                </button>
                <button 
                  onClick={handleDeleteLayout}
                  disabled={!selectedLayoutId || selectedLayoutId === 'initial'}
                  className="py-1 px-3 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Delete Layout
                </button>
              </div>
            </div>
          </div>


          {generatedLabelData && (
            <div className="flex flex-col sm:flex-row gap-2 mt-4 mb-4 no-print">
               <button
                onClick={() => handlePrintSingleLabel(generatedLabelData)}
                className="py-2 px-6 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-slate-100"
                aria-label="Print this currently previewed label"
              >
                Print This Label
              </button>
              <button
                onClick={handleAddLabelToPrintQueue}
                className="py-2 px-6 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-100"
                aria-label="Add current label to print queue"
              >
                Add to Print Queue
              </button>
            </div>
          )}

          {labelsToPrint.length > 0 && (
            <div className="mt-6 p-4 rounded-lg shadow-md w-full no-print bg-slate-800 bg-opacity-50 backdrop-blur-sm" style={{ maxWidth: selectedPrintFormat.screenWidth }}>
              <h3 className="text-lg font-semibold text-gray-100 mb-3">Labels Queued for Printing ({labelsToPrint.length})</h3>
              <ul className="space-y-2 max-h-60 overflow-y-auto mb-4 pr-2">
                {labelsToPrint.map((label, index) => (
                  <li key={index} className="p-2 bg-slate-700 rounded-md text-xs text-gray-200 flex justify-between items-center">
                    <span className="flex-grow mr-2">
                      {index + 1}. {label.type} - {label.thickness}mm x {label.dimension} | DQ: {getDQDisplayText(label.dq)} | Code: {label.plywoodCode} | Qty: {label.quantity}
                    </span>
                    <div className="flex-shrink-0">
                      <button
                        onClick={() => handlePrintSingleLabel(label)}
                        className="mr-2 px-2 py-1 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded focus:outline-none focus:ring-1 focus:ring-green-400"
                        aria-label={`Print label ${index + 1} from queue`}
                      >
                        Print
                      </button>
                      <button
                        onClick={() => handleRemoveLabelFromPrintQueue(index)}
                        className="px-2 py-1 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded focus:outline-none focus:ring-1 focus:ring-red-400"
                        aria-label={`Remove label ${index + 1} from queue`}
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {(generatedLabelData || labelsToPrint.length > 0) && (
            <div className="mt-6 p-4 rounded-lg shadow-md w-full no-print bg-slate-800 bg-opacity-50 backdrop-blur-sm" style={{ maxWidth: selectedPrintFormat.screenWidth }}>
              <h3 className="text-lg font-semibold text-gray-100 mb-3">Print Options</h3>
              <div className="mb-3">
                <label htmlFor="printFormat" className="block text-sm font-medium text-gray-200 mb-1">
                  Label Format (on A4):
                </label>
                <select
                  id="printFormat"
                  name="printFormat"
                  value={selectedPrintFormat.name}
                  onChange={handlePrintFormatChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2.5 text-base border-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-slate-700 text-gray-200 hover:bg-slate-600 transition-colors"
                  aria-label="Select label format for printing"
                >
                  {PRINT_FORMATS.map(format => (
                    <option key={format.name} value={format.name}>
                      {format.description || format.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-3">
                <label htmlFor="numCopies" className="block text-sm font-medium text-gray-200 mb-1">
                  Labels per A4 page:
                </label>
                <input
                  type="number"
                  id="numCopies"
                  name="numCopies"
                  value={numCopies}
                  onChange={(e) => setNumCopies(parseInt(e.target.value, 10) || 1)}
                  min="1"
                  max="2" 
                  className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-slate-900 placeholder-slate-400"
                  aria-describedby="numCopies-description"
                />
                <p id="numCopies-description" className="mt-1 text-xs text-gray-400">
                  1 or 2. Determines how many copies of the label(s) are placed on one A4 sheet.
                </p>
              </div>
              <button
                onClick={handlePrintAllQueued}
                disabled={labelsToPrint.length === 0}
                className={`w-full py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors
                            ${labelsToPrint.length === 0 
                              ? 'bg-gray-400 cursor-not-allowed' 
                              : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-green-500'}`}
                aria-label="Print all queued labels"
              >
                Print All Queued Labels ({labelsToPrint.length})
              </button>
              <button
                onClick={handleResetAll}
                className="mt-4 w-full py-2 px-4 text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-slate-800"
                aria-label="Reset all inputs, preview, and print queue"
              >
                Reset All
              </button>
              <button
                onClick={handlePrintQueueList}
                disabled={labelsToPrint.length === 0}
                className={`mt-2 w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors
                            ${labelsToPrint.length === 0 
                              ? 'bg-gray-400 cursor-not-allowed' 
                              : 'bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-500'}`}
                aria-label="Print a list of all queued labels for verification"
              >
                Print Queue List ({labelsToPrint.length})
              </button>
            </div>
          )}
        </div>
      </main>
      <footer className="mt-auto pt-8 text-center text-slate-400 text-sm no-print w-full">
        <div className="mb-2">
          <p>{CONTACT_DETAILS.company}</p>
          <p>{CONTACT_DETAILS.address}</p>
          <p>{CONTACT_DETAILS.phone}</p>
        </div>
        <p>&copy; {new Date().getFullYear()} FHS Smętek. Wszelkie prawa zastrzeżone. Piotr Nowakowski</p>
      </footer>
      
      {/* Save Layout Modal */}
      {isSaveLayoutModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 no-print">
            <div className="bg-slate-800 p-6 rounded-lg shadow-xl space-y-4 w-full max-w-sm">
                <h3 className="text-xl font-semibold text-white">Save Current Layout</h3>
                <div>
                    <label htmlFor="layoutNameInput" className="block text-sm font-medium text-gray-200 mb-1">
                        Layout Name
                    </label>
                    <input
                        type="text"
                        id="layoutNameInput"
                        value={newLayoutName}
                        onChange={(e) => setNewLayoutName(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-slate-900 placeholder-slate-400"
                        placeholder="e.g., Standard A5 Label"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleConfirmSaveLayout()}
                    />
                </div>
                <div className="flex justify-end gap-4 mt-4">
                    <button
                        onClick={() => setIsSaveLayoutModalOpen(false)}
                        className="py-2 px-4 text-sm font-medium text-gray-200 bg-gray-600 hover:bg-gray-700 rounded-md transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirmSaveLayout}
                        className="py-2 px-4 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default App;