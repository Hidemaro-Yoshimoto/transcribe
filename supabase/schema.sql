-- Supabase database schema for transcription app

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Transcription records table
CREATE TABLE transcription_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    transcription_text TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    file_size BIGINT NOT NULL,
    duration FLOAT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task progress table for real-time updates
CREATE TABLE task_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES transcription_records(id) ON DELETE CASCADE,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    message TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(task_id)
);

-- Indexes for better performance
CREATE INDEX idx_transcription_records_status ON transcription_records(status);
CREATE INDEX idx_transcription_records_created_at ON transcription_records(created_at DESC);
CREATE INDEX idx_task_progress_task_id ON task_progress(task_id);
CREATE INDEX idx_task_progress_updated_at ON task_progress(updated_at DESC);

-- RLS (Row Level Security) policies
ALTER TABLE transcription_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_progress ENABLE ROW LEVEL SECURITY;

-- Allow public read access (you may want to add authentication later)
CREATE POLICY "Public can view transcription records" ON transcription_records
    FOR SELECT USING (true);

CREATE POLICY "Public can insert transcription records" ON transcription_records
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can update transcription records" ON transcription_records
    FOR UPDATE USING (true);

CREATE POLICY "Public can view task progress" ON task_progress
    FOR SELECT USING (true);

CREATE POLICY "Public can insert task progress" ON task_progress
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can update task progress" ON task_progress
    FOR UPDATE USING (true);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_transcription_records_updated_at
    BEFORE UPDATE ON transcription_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_progress_updated_at
    BEFORE UPDATE ON task_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Storage bucket for audio files
INSERT INTO storage.buckets (id, name, public) VALUES ('audio-files', 'audio-files', false);

-- Storage policies
CREATE POLICY "Public can upload audio files" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'audio-files');

CREATE POLICY "Public can view audio files" ON storage.objects
    FOR SELECT USING (bucket_id = 'audio-files');

CREATE POLICY "Public can delete audio files" ON storage.objects
    FOR DELETE USING (bucket_id = 'audio-files');