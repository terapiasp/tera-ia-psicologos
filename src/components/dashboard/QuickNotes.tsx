import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { StickyNote } from 'lucide-react';

export const QuickNotes = () => {
  const [notes, setNotes] = useState('');

  useEffect(() => {
    // Carregar nota da sessão atual
    const savedNotes = sessionStorage.getItem('quick-notes');
    if (savedNotes) {
      setNotes(savedNotes);
    }
  }, []);

  const handleNotesChange = (value: string) => {
    setNotes(value);
    // Salvar automaticamente na sessão
    sessionStorage.setItem('quick-notes', value);
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <StickyNote className="h-5 w-5" />
          Anotações Rápidas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea
          placeholder="Escreva suas anotações do dia aqui..."
          value={notes}
          onChange={(e) => handleNotesChange(e.target.value)}
          className="min-h-[150px] resize-none"
        />
        <p className="text-xs text-muted-foreground mt-2">
          Suas anotações são salvas automaticamente durante a sessão
        </p>
      </CardContent>
    </Card>
  );
};