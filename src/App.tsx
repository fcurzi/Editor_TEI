import React, { useState, useCallback, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Check, Code, FileText, Undo, Redo, Download } from 'lucide-react';

interface ValidationMessage {
  type: 'error' | 'success' | 'warning';
  message: string;
}

function App() {
  const [xmlContent, setXmlContent] = useState<string>(`<?xml version="1.0" encoding="UTF-8"?>
<TEI xmlns="http://www.tei-c.org/ns/1.0" xml:lang="it">
  <teiHeader>
    <fileDesc>
      <titleStmt>
        <title>TEI Didattica UniMC</title>
        <author>Nome Autore</author>
      </titleStmt>
      <publicationStmt>
        <publisher>UniMC</publisher>
        <availability status="free">
          <p>Materiale didattico liberamente disponibile</p>
        </availability>
      </publicationStmt>
      <sourceDesc>
        <p>Creato da zero</p>
      </sourceDesc>
    </fileDesc>
    <encodingDesc>
      <appInfo>
        <application ident="TEI_Editor" version="1.0" when="2024-11-26">
          <desc>Documento creato con l'editor TEI UniMC</desc>
        </application>
      </appInfo>
    </encodingDesc>
  </teiHeader>
  <text>
    <body>
      <head>Il mio documento TEI</head>
      <p>Il tuo testo qui...</p>
    </body>
  </text>
</TEI>`);

  const [validationMessages, setValidationMessages] = useState<ValidationMessage[]>([]);
  const historyRef = useRef<string[]>([xmlContent]);
  const currentIndexRef = useRef<number>(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const addToHistory = useCallback((content: string) => {
    const newHistory = [
      ...historyRef.current.slice(0, currentIndexRef.current + 1),
      content
    ];
    historyRef.current = newHistory;
    currentIndexRef.current = newHistory.length - 1;
  }, []);

  const undo = useCallback(() => {
    if (currentIndexRef.current > 0) {
      currentIndexRef.current--;
      setXmlContent(historyRef.current[currentIndexRef.current]);
    }
  }, []);

  const redo = useCallback(() => {
    if (currentIndexRef.current < historyRef.current.length - 1) {
      currentIndexRef.current++;
      setXmlContent(historyRef.current[currentIndexRef.current]);
    }
  }, []);

  const validateXMLSyntax = useCallback(() => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlContent, "text/xml");
      
      const parserError = xmlDoc.getElementsByTagName("parsererror");
      if (parserError.length) {
        setValidationMessages([{
          type: 'error',
          message: parserError[0].textContent || 'Errore di parsing XML'
        }]);
        return false;
      }

      setValidationMessages([{
        type: 'success',
        message: 'La sintassi XML è valida'
      }]);
      return true;
    } catch (e) {
      setValidationMessages([{
        type: 'error',
        message: `Errore di parsing XML: ${e instanceof Error ? e.message : 'Errore sconosciuto'}`
      }]);
      return false;
    }
  }, [xmlContent]);

  const validateTEI = useCallback(() => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlContent, "text/xml");
      const messages: ValidationMessage[] = [];
      
      const tei = xmlDoc.documentElement;
      if (!tei || tei.tagName !== 'TEI') {
        messages.push({
          type: 'error',
          message: 'L\'elemento radice deve essere <TEI>'
        });
        setValidationMessages(messages);
        return;
      }

      if (tei.namespaceURI !== 'http://www.tei-c.org/ns/1.0') {
        messages.push({
          type: 'error',
          message: 'Namespace TEI mancante o non corretto'
        });
      }

      const teiHeader = tei.getElementsByTagName('teiHeader')[0];
      const text = tei.getElementsByTagName('text')[0];

      if (!teiHeader || !text) {
        messages.push({
          type: 'error',
          message: 'Elementi obbligatori mancanti (teiHeader o text)'
        });
      }

      if (messages.length === 0) {
        messages.push({
          type: 'success',
          message: 'Il documento è conforme alle specifiche TEI'
        });
      }

      setValidationMessages(messages);
    } catch (e) {
      setValidationMessages([{
        type: 'error',
        message: `Errore durante la validazione TEI: ${e instanceof Error ? e.message : 'Errore sconosciuto'}`
      }]);
    }
  }, [xmlContent]);

  const formatXML = useCallback(() => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlContent, "text/xml");
      
      if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
        throw new Error("Correggi prima gli errori di sintassi XML");
      }
      
      const serializer = new XMLSerializer();
      const formatted = serializer.serializeToString(xmlDoc)
        .replace(/(>)(<)(\/*)/g, '$1\n$2$3')
        .replace(/<(.*?)>/g, (match) => match.replace(/\s+/g, ' '))
        .split('\n')
        .map(line => line.trim())
        .join('\n');
      
      setXmlContent(formatted);
      addToHistory(formatted);
      
      setValidationMessages([{
        type: 'success',
        message: 'Documento formattato correttamente'
      }]);
    } catch (e) {
      setValidationMessages([{
        type: 'error',
        message: e instanceof Error ? e.message : 'Errore sconosciuto'
      }]);
    }
  }, [xmlContent, addToHistory]);

  const downloadXML = useCallback(() => {
    const blob = new Blob([xmlContent], { type: 'application/xml' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'documento-tei.xml';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }, [xmlContent]);

  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setXmlContent(newContent);
    addToHistory(newContent);
  }, [addToHistory]);

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between bg-gray-100 p-4 rounded-lg">
        <div className="flex items-center gap-4">
          <img 
            src="/api/placeholder/64/64"
            alt="Logo UniMC" 
            className="h-16"
          />
          <div className="space-y-1">
            <h1 className="text-xl font-bold">Università di Macerata</h1>
            <p className="text-sm">Dipartimento di Studi Umanistici</p>
            <p className="text-sm">Prof. Fabio Curzi</p>
            <p className="text-sm">Corso di Abilità informatiche e telematiche</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-6 h-6" />
            Editor XML-TEI UniMC
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button onClick={undo} disabled={currentIndexRef.current === 0}>
                <Undo className="w-4 h-4 mr-2" />
                Annulla
              </Button>
              <Button onClick={redo} disabled={currentIndexRef.current === historyRef.current.length - 1}>
                <Redo className="w-4 h-4 mr-2" />
                Ripeti
              </Button>
              <Button onClick={formatXML}>
                <Code className="w-4 h-4 mr-2" />
                Formatta
              </Button>
              <Button onClick={validateXMLSyntax} variant="secondary">
                <AlertCircle className="w-4 h-4 mr-2" />
                Valida XML
              </Button>
              <Button onClick={validateTEI}>
                <Check className="w-4 h-4 mr-2" />
                Valida TEI
              </Button>
              <Button onClick={downloadXML}>
                <Download className="w-4 h-4 mr-2" />
                Scarica XML
              </Button>
            </div>
            
            <textarea
              ref={textareaRef}
              value={xmlContent}
              onChange={handleContentChange}
              className="w-full h-96 font-mono text-sm p-4 border rounded-md"
              spellCheck="false"
            />

            <div className="space-y-2">
              {validationMessages.map((msg, i) => (
                <Alert key={i} variant={msg.type === 'error' ? 'destructive' : 'default'}>
                  {msg.type === 'error' ? (
                    <AlertCircle className="w-4 h-4" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <AlertDescription>{msg.message}</AlertDescription>
                </Alert>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default App;
