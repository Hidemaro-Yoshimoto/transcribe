"""
音声処理サービス - FFmpeg ラッパー
"""
import os
import ffmpeg
import tempfile
from typing import List, Tuple
from pathlib import Path


class AudioProcessor:
    """音声ファイル処理クラス"""
    
    MAX_DURATION = 30 * 60  # 30分（秒）
    
    def __init__(self):
        self.temp_dir = tempfile.mkdtemp()
    
    def convert_to_wav(self, input_path: str, output_path: str) -> bool:
        """
        音声/動画ファイルをWAVに変換
        
        Args:
            input_path: 入力ファイルパス
            output_path: 出力ファイルパス
            
        Returns:
            bool: 変換成功フラグ
        """
        try:
            (
                ffmpeg
                .input(input_path)
                .output(output_path, acodec='pcm_s16le', ac=1, ar='16000')
                .overwrite_output()
                .run(quiet=True)
            )
            return True
        except ffmpeg.Error as e:
            print(f"FFmpeg error: {e}")
            return False
    
    def get_audio_duration(self, file_path: str) -> float:
        """
        音声ファイルの長さを取得
        
        Args:
            file_path: 音声ファイルパス
            
        Returns:
            float: 長さ（秒）
        """
        try:
            probe = ffmpeg.probe(file_path)
            duration = float(probe['streams'][0]['duration'])
            return duration
        except (ffmpeg.Error, KeyError, ValueError):
            return 0.0
    
    def split_audio(self, input_path: str, max_duration: int = MAX_DURATION) -> List[str]:
        """
        音声ファイルを指定時間で分割
        
        Args:
            input_path: 入力ファイルパス
            max_duration: 最大時間（秒）
            
        Returns:
            List[str]: 分割されたファイルパスのリスト
        """
        duration = self.get_audio_duration(input_path)
        if duration <= max_duration:
            return [input_path]
        
        segments = []
        num_segments = int(duration // max_duration) + 1
        
        for i in range(num_segments):
            start_time = i * max_duration
            segment_path = os.path.join(
                self.temp_dir, 
                f"segment_{i:03d}.wav"
            )
            
            try:
                (
                    ffmpeg
                    .input(input_path, ss=start_time, t=max_duration)
                    .output(segment_path, acodec='pcm_s16le', ac=1, ar='16000')
                    .overwrite_output()
                    .run(quiet=True)
                )
                segments.append(segment_path)
            except ffmpeg.Error as e:
                print(f"Segment {i} error: {e}")
                continue
        
        return segments
    
    def process_audio_file(self, input_path: str) -> Tuple[List[str], float]:
        """
        音声ファイルを処理（変換・分割）
        
        Args:
            input_path: 入力ファイルパス
            
        Returns:
            Tuple[List[str], float]: (処理済みファイルパス, 総時間)
        """
        # 一時WAVファイルパス
        temp_wav = os.path.join(self.temp_dir, "converted.wav")
        
        # WAVに変換
        if not self.convert_to_wav(input_path, temp_wav):
            return [], 0.0
        
        # 総時間取得
        total_duration = self.get_audio_duration(temp_wav)
        
        # 分割
        segments = self.split_audio(temp_wav)
        
        return segments, total_duration
    
    def cleanup(self) -> None:
        """一時ファイルクリーンアップ"""
        import shutil
        try:
            shutil.rmtree(self.temp_dir)
        except OSError:
            pass