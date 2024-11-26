import React, { useState, useCallback, useRef } from 'react';

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
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
      <div style={{ 
        background: '#f3f4f6', 
        padding: '1rem', 
        borderRadius: '0.5rem',
        marginBottom: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <img 
            src="/api/placeholder/64/64" 
            alt="Logo UniMC" 
            style={{ height: '4rem' }}
          />
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              Università di Macerata
            </h1>
            <p style={{ fontSize: '0.875rem' }}>Dipartimento di Studi Umanistici</p>
            <p style={{ fontSize: '0.875rem' }}>Prof. Fabio Curzi</p>
            <p style={{ fontSize: '0.875rem' }}>Corso di Abilità informatiche e telematiche</p>
          </div>
        </div>
      </div>

      <div style={{ 
        border: '1px solid #e5e7eb',
        borderRadius: '0.5rem',
        overflow: 'hidden'
      }}>
        <div style={{ 
          padding: '1rem',
          borderBottom: '1px solid #e5e7eb',
          background: '#f9fafb'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
            Editor XML-TEI UniMC
          </h2>
        </div>

        <div style={{ padding: '1rem' }}>
          <div style={{ 
            display: 'flex',
            gap: '0.5rem',
            flexWrap: 'wrap',
            marginBottom: '1rem'
          }}>
            <button
              onClick={undo}
              disabled={currentIndexRef.current === 0}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                background: '#ffffff',
                cursor: 'pointer',
                opacity: currentIndexRef.current === 0 ? '0.5' : '1'
              }}
            >
              Annulla
            </button>
            <button
              onClick={redo}
              disabled={currentIndexRef.current === historyRef.current.length - 1}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                background: '#ffffff',
                cursor: 'pointer',
                opacity: currentIndexRef.current === historyRef.current.length - 1 ? '0.5' : '1'
              }}
            >
              Ripeti
            </button>
            <button
              onClick={formatXML}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                background: '#ffffff',
                cursor: 'pointer'
              }}
            >
              Formatta
            </button>
            <button
              onClick={validateXMLSyntax}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                background: '#f3f4f6',
                cursor: 'pointer'
              }}
            >
              Valida XML
            </button>
            <button
              onClick={validateTEI}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                background: '#ffffff',
                cursor: 'pointer'
              }}
            >
              Valida TEI
            </button>
            <button
              onClick={downloadXML}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                background: '#ffffff',
                cursor: 'pointer'
              }}
            >
              Scarica XML
            </button>
          </div>
          
          <textarea
            ref={textareaRef}
            value={xmlContent}
            onChange={handleContentChange}
            style={{
              width: '100%',
              height: '24rem',
              padding: '1rem',
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              marginBottom: '1rem'
            }}
            spellCheck="false"
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {validationMessages.map((msg, i) => (
              <div
                key={i}
                style={{
                  padding: '0.75rem',
                  borderRadius: '0.375rem',
                  background: msg.type === 'error' ? '#fee2e2' : '#dcfce7',
                  color: msg.type === 'error' ? '#991b1b' : '#166534'
                }}
              >
                {msg.message}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
