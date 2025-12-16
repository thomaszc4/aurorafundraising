import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Type, Image, Columns, Square, MousePointer,
  Save, Eye, Plus, Trash2, GripVertical, Settings
} from 'lucide-react';
import { toast } from 'sonner';
import DOMPurify from 'dompurify';

interface EmailBlock {
  id: string;
  type: 'header' | 'text' | 'image' | 'button' | 'divider' | 'columns';
  content: Record<string, any>;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  template_type: string;
  is_system: boolean;
}

interface EmailTemplateBuilderProps {
  campaignId: string;
  onClose?: () => void;
}

const BLOCK_TYPES = [
  { type: 'header', icon: Type, label: 'Header' },
  { type: 'text', icon: Type, label: 'Text Block' },
  { type: 'image', icon: Image, label: 'Image' },
  { type: 'button', icon: MousePointer, label: 'Button' },
  { type: 'divider', icon: Square, label: 'Divider' },
  { type: 'columns', icon: Columns, label: '2 Columns' },
];

const MERGE_TAGS = [
  { tag: '{{donor_name}}', label: 'Donor Name' },
  { tag: '{{campaign_name}}', label: 'Program Name' },
  { tag: '{{donation_amount}}', label: 'Donation Amount' },
  { tag: '{{organization_name}}', label: 'Organization Name' },
];

export function EmailTemplateBuilder({ campaignId, onClose }: EmailTemplateBuilderProps) {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [templateName, setTemplateName] = useState('');
  const [templateSubject, setTemplateSubject] = useState('');
  const [templateType, setTemplateType] = useState('general');
  const [blocks, setBlocks] = useState<EmailBlock[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, [campaignId]);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .or(`campaign_id.eq.${campaignId},is_system.eq.true`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setTemplateName(template.name);
      setTemplateSubject(template.subject);
      setTemplateType(template.template_type);
      parseHtmlToBlocks(template.body);
    }
  };

  const parseHtmlToBlocks = (html: string) => {
    // Simple parser - in production you'd want something more robust
    const newBlocks: EmailBlock[] = [
      {
        id: crypto.randomUUID(),
        type: 'text',
        content: { html }
      }
    ];
    setBlocks(newBlocks);
  };

  const addBlock = (type: EmailBlock['type']) => {
    const newBlock: EmailBlock = {
      id: crypto.randomUUID(),
      type,
      content: getDefaultContent(type),
    };
    setBlocks([...blocks, newBlock]);
    setSelectedBlock(newBlock.id);
  };

  const getDefaultContent = (type: EmailBlock['type']): Record<string, any> => {
    switch (type) {
      case 'header':
        return { text: 'Your Header Here', level: 'h1', align: 'center', color: '#2563eb' };
      case 'text':
        return { html: '<p>Enter your text here...</p>', align: 'left' };
      case 'image':
        return { src: '', alt: 'Image', width: '100%', align: 'center' };
      case 'button':
        return { text: 'Click Here', url: '#', bgColor: '#2563eb', textColor: '#ffffff', align: 'center' };
      case 'divider':
        return { style: 'solid', color: '#e5e7eb', width: '100%' };
      case 'columns':
        return { left: '<p>Left column</p>', right: '<p>Right column</p>' };
      default:
        return {};
    }
  };

  const updateBlock = (blockId: string, content: Record<string, any>) => {
    setBlocks(blocks.map(b => b.id === blockId ? { ...b, content } : b));
  };

  const deleteBlock = (blockId: string) => {
    setBlocks(blocks.filter(b => b.id !== blockId));
    if (selectedBlock === blockId) setSelectedBlock(null);
  };

  const moveBlock = (blockId: string, direction: 'up' | 'down') => {
    const index = blocks.findIndex(b => b.id === blockId);
    if (direction === 'up' && index > 0) {
      const newBlocks = [...blocks];
      [newBlocks[index - 1], newBlocks[index]] = [newBlocks[index], newBlocks[index - 1]];
      setBlocks(newBlocks);
    } else if (direction === 'down' && index < blocks.length - 1) {
      const newBlocks = [...blocks];
      [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
      setBlocks(newBlocks);
    }
  };

  const renderBlockToHtml = (block: EmailBlock): string => {
    const { type, content } = block;
    switch (type) {
      case 'header':
        return `<${content.level} style="text-align: ${content.align}; color: ${content.color}; margin: 0 0 16px 0;">${content.text}</${content.level}>`;
      case 'text':
        return `<div style="text-align: ${content.align};">${content.html}</div>`;
      case 'image':
        return `<div style="text-align: ${content.align};"><img src="${content.src}" alt="${content.alt}" style="max-width: ${content.width}; height: auto;" /></div>`;
      case 'button':
        return `<div style="text-align: ${content.align}; margin: 16px 0;"><a href="${content.url}" style="display: inline-block; background: ${content.bgColor}; color: ${content.textColor}; padding: 12px 24px; text-decoration: none; border-radius: 6px;">${content.text}</a></div>`;
      case 'divider':
        return `<hr style="border: none; border-top: 1px ${content.style} ${content.color}; width: ${content.width}; margin: 16px 0;" />`;
      case 'columns':
        return `<table width="100%" cellpadding="0" cellspacing="0"><tr><td width="50%" style="padding-right: 10px; vertical-align: top;">${content.left}</td><td width="50%" style="padding-left: 10px; vertical-align: top;">${content.right}</td></tr></table>`;
      default:
        return '';
    }
  };

  const generateFullHtml = (): string => {
    const bodyContent = blocks.map(renderBlockToHtml).join('\n');
    return `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">${bodyContent}</div>`;
  };

  const handleSave = async () => {
    if (!templateName || !templateSubject) {
      toast.error('Please enter template name and subject');
      return;
    }

    try {
      const htmlBody = generateFullHtml();

      if (selectedTemplate) {
        const { error } = await supabase
          .from('email_templates')
          .update({
            name: templateName,
            subject: templateSubject,
            body: htmlBody,
            template_type: templateType,
          })
          .eq('id', selectedTemplate);

        if (error) throw error;
        toast.success('Template updated successfully');
      } else {
        const { error } = await supabase
          .from('email_templates')
          .insert({
            campaign_id: campaignId,
            name: templateName,
            subject: templateSubject,
            body: htmlBody,
            template_type: templateType,
            is_system: false,
          });

        if (error) throw error;
        toast.success('Template created successfully');
      }

      fetchTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    }
  };

  const handleNewTemplate = () => {
    setSelectedTemplate('');
    setTemplateName('');
    setTemplateSubject('');
    setTemplateType('general');
    setBlocks([]);
    setSelectedBlock(null);
  };

  const renderBlockEditor = () => {
    const block = blocks.find(b => b.id === selectedBlock);
    if (!block) return null;

    return (
      <div className="space-y-4">
        <h4 className="font-medium flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Edit {block.type}
        </h4>

        {block.type === 'header' && (
          <>
            <Input
              value={block.content.text}
              onChange={(e) => updateBlock(block.id, { ...block.content, text: e.target.value })}
              placeholder="Header text"
            />
            <Select
              value={block.content.level}
              onValueChange={(v) => updateBlock(block.id, { ...block.content, level: v })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="h1">Heading 1</SelectItem>
                <SelectItem value="h2">Heading 2</SelectItem>
                <SelectItem value="h3">Heading 3</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="color"
              value={block.content.color}
              onChange={(e) => updateBlock(block.id, { ...block.content, color: e.target.value })}
            />
          </>
        )}

        {block.type === 'text' && (
          <Textarea
            value={block.content.html}
            onChange={(e) => updateBlock(block.id, { ...block.content, html: e.target.value })}
            rows={6}
            placeholder="HTML content"
          />
        )}

        {block.type === 'image' && (
          <>
            <Input
              value={block.content.src}
              onChange={(e) => updateBlock(block.id, { ...block.content, src: e.target.value })}
              placeholder="Image URL"
            />
            <Input
              value={block.content.alt}
              onChange={(e) => updateBlock(block.id, { ...block.content, alt: e.target.value })}
              placeholder="Alt text"
            />
          </>
        )}

        {block.type === 'button' && (
          <>
            <Input
              value={block.content.text}
              onChange={(e) => updateBlock(block.id, { ...block.content, text: e.target.value })}
              placeholder="Button text"
            />
            <Input
              value={block.content.url}
              onChange={(e) => updateBlock(block.id, { ...block.content, url: e.target.value })}
              placeholder="Button URL"
            />
            <div className="flex gap-2">
              <div>
                <label className="text-xs">Background</label>
                <Input
                  type="color"
                  value={block.content.bgColor}
                  onChange={(e) => updateBlock(block.id, { ...block.content, bgColor: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs">Text Color</label>
                <Input
                  type="color"
                  value={block.content.textColor}
                  onChange={(e) => updateBlock(block.id, { ...block.content, textColor: e.target.value })}
                />
              </div>
            </div>
          </>
        )}

        {block.type === 'columns' && (
          <>
            <div>
              <label className="text-sm">Left Column</label>
              <Textarea
                value={block.content.left}
                onChange={(e) => updateBlock(block.id, { ...block.content, left: e.target.value })}
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm">Right Column</label>
              <Textarea
                value={block.content.right}
                onChange={(e) => updateBlock(block.id, { ...block.content, right: e.target.value })}
                rows={3}
              />
            </div>
          </>
        )}

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => moveBlock(block.id, 'up')}>↑ Up</Button>
          <Button variant="outline" size="sm" onClick={() => moveBlock(block.id, 'down')}>↓ Down</Button>
          <Button variant="destructive" size="sm" onClick={() => deleteBlock(block.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Email Template Builder</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setPreviewMode(!previewMode)}>
            <Eye className="h-4 w-4 mr-2" />
            {previewMode ? 'Edit' : 'Preview'}
          </Button>
          {onClose && <Button variant="outline" onClick={onClose}>Close</Button>}
        </div>
      </div>

      <div className="flex gap-4">
        <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Load existing template" />
          </SelectTrigger>
          <SelectContent>
            {templates.map(t => (
              <SelectItem key={t.id} value={t.id}>
                {t.name} {t.is_system && '(System)'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={handleNewTemplate}>
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        {/* Block Palette */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Add Blocks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {BLOCK_TYPES.map(({ type, icon: Icon, label }) => (
              <Button
                key={type}
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => addBlock(type as EmailBlock['type'])}
              >
                <Icon className="h-4 w-4 mr-2" />
                {label}
              </Button>
            ))}

            <div className="border-t pt-4 mt-4">
              <p className="text-xs font-medium mb-2">Merge Tags</p>
              <div className="space-y-1">
                {MERGE_TAGS.map(({ tag, label }) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="cursor-pointer text-xs mr-1"
                    onClick={() => navigator.clipboard.writeText(tag)}
                  >
                    {label}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Canvas */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="space-y-2">
              <Input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Template name"
              />
              <Input
                value={templateSubject}
                onChange={(e) => setTemplateSubject(e.target.value)}
                placeholder="Email subject line"
              />
              <Select value={templateType} onValueChange={setTemplateType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="thank_you">Thank You</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="survey">Survey</SelectItem>
                  <SelectItem value="impact">Impact Update</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {previewMode ? (
              <div
                className="border rounded-lg p-4 bg-white min-h-[400px]"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(generateFullHtml()) }}
              />
            ) : (
              <div className="space-y-2 min-h-[400px]">
                {blocks.length === 0 ? (
                  <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
                    Add blocks from the left panel to build your email
                  </div>
                ) : (
                  blocks.map(block => (
                    <div
                      key={block.id}
                      className={`border rounded-lg p-3 cursor-pointer transition-colors ${selectedBlock === block.id ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                        }`}
                      onClick={() => setSelectedBlock(block.id)}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="outline" className="text-xs">{block.type}</Badge>
                      </div>
                      <div
                        className="text-sm"
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(renderBlockToHtml(block)) }}
                      />
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Block Editor */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Block Settings</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedBlock ? renderBlockEditor() : (
              <p className="text-sm text-muted-foreground">
                Select a block to edit its properties
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-2">
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Save Template
        </Button>
      </div>
    </div>
  );
}
