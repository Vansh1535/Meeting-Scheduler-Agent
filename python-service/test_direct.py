import json
import requests

# Load test data
with open('test_request.json', 'r') as f:
    data = json.load(f)

# Send request
try:
    response = requests.post('http://localhost:8000/schedule', json=data)
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"\n✓ SUCCESS")
        print(f"Meeting ID: {result['meeting_id']}")
        print(f"Candidates Found: {len(result['candidates'])}")
        print(f"Processing Time: {result['processing_time_ms']}ms")
        
        if result['candidates']:
            top = result['candidates'][0]
            print(f"\nTop Candidate:")
            print(f"  Time: {top['slot']['start']}")
            print(f"  Score: {top['score']}/100")
            print(f"  Reasoning: {top['reasoning']}")
    else:
        print(f"\n✗ ERROR")
        print(response.text)
        
except Exception as e:
    print(f"Error: {e}")
