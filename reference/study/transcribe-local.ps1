$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Speech
$engine = New-Object System.Speech.Recognition.SpeechRecognitionEngine('MS-1033-80-DESK')
$engine.LoadGrammar((New-Object System.Speech.Recognition.DictationGrammar))
$engine.SetInputToWaveFile((Join-Path $PWD 'pipeline/quality/reference-study/audio.wav'))
$segments = @()
while ($null -ne ($result = $engine.Recognize())) {
 $segments += [PSCustomObject]@{text=$result.Text;confidence=$result.Confidence;start=$result.Audio.AudioPosition.TotalSeconds;duration=$result.Audio.Duration.TotalSeconds;words=@($result.Words | ForEach-Object {[PSCustomObject]@{word=$_.Text;confidence=$_.Confidence;start=$result.Audio.AudioPosition.TotalSeconds+$_.AudioPosition.TotalSeconds;duration=$_.AudioDuration.TotalSeconds}})}
}
$engine.Dispose()
$segments | ConvertTo-Json -Depth 5 | Set-Content pipeline/quality/reference-study/offline-speech-unverified.json -Encoding utf8
$segments | Select-Object start,duration,confidence,text | Format-Table -Wrap
