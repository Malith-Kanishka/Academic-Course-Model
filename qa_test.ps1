$baseUrl = "http://localhost:5000/api/sessions"

Write-Host "Waiting for C# Backend on port 5000..."
while (!(Test-NetConnection -ComputerName localhost -Port 5000 -InformationLevel Quiet -WarningAction SilentlyContinue)) { Start-Sleep -Seconds 1 }
Write-Host "Waiting for Python Backend on port 8000..."
while (!(Test-NetConnection -ComputerName localhost -Port 8000 -InformationLevel Quiet -WarningAction SilentlyContinue)) { Start-Sleep -Seconds 1 }

$studentId = [guid]::NewGuid().ToString()
$topicId = [guid]::NewGuid().ToString()
$body = @{
    studentId = $studentId
    topicId = $topicId
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "$baseUrl/start" -Method Post -Body $body -ContentType "application/json"
$sessionId = $response.id
Write-Host "Created Session ID: $sessionId"

Invoke-RestMethod -Uri "$baseUrl/$sessionId/mock-turn" -Method Post
Write-Host "Added Mock Turn"

$endResponse = Invoke-RestMethod -Uri "$baseUrl/$sessionId/end" -Method Post
Write-Host "End Session Response:"
$endResponse | ConvertTo-Json -Depth 5
