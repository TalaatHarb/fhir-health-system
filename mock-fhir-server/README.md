# Mock FHIR Server

A mock FHIR R4 server for development and testing of the FHIR Resource Visualizer application.

## Features

- **FHIR R4 Compliant**: Implements FHIR R4 REST API endpoints
- **Multiple Resource Types**: Organizations, Patients, Encounters, Observations, Conditions, MedicationRequests, DiagnosticReports, Procedures
- **Search Functionality**: Support for search parameters and pagination
- **CORS Enabled**: Ready for cross-origin requests from frontend applications
- **Realistic Data**: Pre-populated with realistic healthcare scenarios
- **Error Handling**: Proper HTTP status codes and FHIR OperationOutcome responses

## Quick Start

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. Navigate to the mock-fhir-server directory:
```bash
cd mock-fhir-server
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:

**Option 1: Using npm**
```bash
npm start
```

**Option 2: Using startup scripts**
```bash
# On Windows
start-server.bat

# On macOS/Linux
chmod +x start-server.sh
./start-server.sh
```

The server will start on port 3001 by default. You can access it at:
- Base URL: `http://localhost:3001/fhir/R4`
- Capability Statement: `http://localhost:3001/fhir/R4/metadata`

### Development Mode

For development with auto-restart on file changes:
```bash
npm run dev
```

### Testing the Server

To verify that all endpoints are working correctly:
```bash
npm test
```

This will run a comprehensive test suite that checks:
- Server connectivity and capability statement
- All resource type endpoints (GET and search)
- Search parameters and pagination
- Individual resource retrieval
- FHIR bundle responses and metadata

The test script will provide detailed output showing the status of each endpoint and any errors encountered.

## API Endpoints

### Base URL
All FHIR endpoints are prefixed with `/fhir/R4`

### Capability Statement
- `GET /fhir/R4/metadata` - Returns the server's capability statement

### Organizations
- `GET /fhir/R4/Organization` - Search organizations
- `GET /fhir/R4/Organization/{id}` - Get organization by ID

### Patients
- `GET /fhir/R4/Patient` - Search patients
- `GET /fhir/R4/Patient/{id}` - Get patient by ID
- `POST /fhir/R4/Patient` - Create new patient

#### Patient Search Parameters
- `name` - Search by patient name (given or family)
- `identifier` - Search by patient identifier
- `birthdate` - Search by birth date (YYYY-MM-DD)
- `gender` - Search by gender (male, female, other, unknown)
- `_count` - Number of results per page (default: 20)
- `_offset` - Offset for pagination (default: 0)

Example: `GET /fhir/R4/Patient?name=Smith&_count=10`

### Encounters
- `GET /fhir/R4/Encounter` - Search encounters
- `GET /fhir/R4/Encounter/{id}` - Get encounter by ID
- `POST /fhir/R4/Encounter` - Create new encounter

#### Encounter Search Parameters
- `patient` - Filter by patient reference (e.g., `Patient/patient-1`)
- `status` - Filter by encounter status
- `_count` - Number of results per page
- `_offset` - Offset for pagination

### Observations
- `GET /fhir/R4/Observation` - Search observations
- `GET /fhir/R4/Observation/{id}` - Get observation by ID
- `POST /fhir/R4/Observation` - Create new observation

#### Observation Search Parameters
- `patient` - Filter by patient reference
- `encounter` - Filter by encounter reference
- `_count` - Number of results per page
- `_offset` - Offset for pagination

### Conditions
- `GET /fhir/R4/Condition` - Search conditions
- `GET /fhir/R4/Condition/{id}` - Get condition by ID
- `POST /fhir/R4/Condition` - Create new condition

### Medication Requests
- `GET /fhir/R4/MedicationRequest` - Search medication requests
- `GET /fhir/R4/MedicationRequest/{id}` - Get medication request by ID
- `POST /fhir/R4/MedicationRequest` - Create new medication request

### Diagnostic Reports
- `GET /fhir/R4/DiagnosticReport` - Search diagnostic reports
- `GET /fhir/R4/DiagnosticReport/{id}` - Get diagnostic report by ID
- `POST /fhir/R4/DiagnosticReport` - Create new diagnostic report

### Procedures
- `GET /fhir/R4/Procedure` - Search procedures
- `GET /fhir/R4/Procedure/{id}` - Get procedure by ID
- `POST /fhir/R4/Procedure` - Create new procedure

## Sample Data

The server comes pre-populated with comprehensive sample data including:

### Organizations (3 total)
- **General Hospital** (org-1) - Main hospital in Medical City, CA
- **Community Health Center** (org-2) - Community clinic in Healthville, NY
- **Specialty Medical Group** (org-3) - Specialist group in Expert Town, TX

### Patients (6 total)
- **John Michael Smith** (patient-1) - Male, born 1985-03-15, managed by General Hospital
- **Sarah Elizabeth Johnson** (patient-2) - Female, born 1992-07-22, managed by General Hospital
- **Robert James Williams** (patient-3) - Male, born 1978-11-08, managed by Community Health Center
- **Emily Rose Davis** (patient-4) - Female, born 1995-12-03, managed by Specialty Medical Group
- **Michael David Brown** (patient-5) - Male, born 1960-05-20, managed by General Hospital
- **Jennifer Marie Wilson** (patient-6) - Female, born 1988-09-14, managed by Community Health Center

### Sample Healthcare Scenarios
The server includes 6 encounters with comprehensive clinical data:

#### Routine Care Scenarios
- **Annual check-ups** with complete vital signs (blood pressure, heart rate, weight)
- **Preventive care** visits with physical examinations and health assessments
- **Laboratory screenings** including complete blood count and metabolic panels

#### Acute Care Scenarios
- **Symptom-based visits** for headaches, chest pain, and fatigue
- **Diagnostic workups** with appropriate imaging and laboratory tests
- **Treatment plans** with medications and follow-up procedures

#### Clinical Resources (35+ total)
- **7 Observations**: Vital signs, laboratory results with reference ranges and interpretations
- **3 Conditions**: Headache, hypertension, anemia with varying severities
- **3 Medication Requests**: Pain management, blood pressure control, iron supplementation
- **3 Diagnostic Reports**: Blood work, chest X-ray, metabolic panel with clinical conclusions
- **3 Procedures**: Physical examinations, imaging studies, blood draws with outcomes

Each scenario includes realistic clinical relationships between encounters, conditions, observations, medications, and procedures, providing a comprehensive dataset for testing healthcare applications.

## Error Handling

The server returns appropriate HTTP status codes and FHIR OperationOutcome resources for errors:

- `400 Bad Request` - Invalid search parameters or malformed requests
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server errors

Example error response:
```json
{
  "resourceType": "OperationOutcome",
  "issue": [{
    "severity": "error",
    "code": "not-found",
    "diagnostics": "Patient not found"
  }]
}
```

## FHIR Bundle Responses

Search operations return FHIR Bundle resources with:
- Total count of matching resources
- Pagination links (self, next, previous)
- Entry array with matching resources
- Search metadata

Example bundle structure:
```json
{
  "resourceType": "Bundle",
  "type": "searchset",
  "total": 4,
  "entry": [
    {
      "fullUrl": "http://localhost:3001/fhir/R4/Patient/patient-1",
      "resource": { ... },
      "search": { "mode": "match" }
    }
  ],
  "link": [
    {
      "relation": "self",
      "url": "http://localhost:3001/fhir/R4/Patient?name=Smith"
    }
  ]
}
```

## Configuration

### Environment Variables
- `PORT` - Server port (default: 3001)

### CORS Configuration
The server is configured to accept requests from any origin for development purposes. In production, you should configure CORS to only allow requests from your application's domain.

### Customizing Mock Data
To modify or extend the mock data:

1. **Edit existing data**: Modify resources in `data/mockData.js`
2. **Add new patients**: Follow the existing patient structure with unique IDs
3. **Create new encounters**: Link encounters to existing patients using proper references
4. **Add clinical resources**: Ensure proper patient and encounter references
5. **Update relationships**: Maintain FHIR reference integrity between resources

### Adding New Resource Types
To support additional FHIR resource types:

1. Add sample data to `data/mockData.js`
2. Create endpoints in `server.js` following the existing pattern
3. Update the capability statement in the `/metadata` endpoint
4. Add search parameters to `utils/searchUtils.js` if needed
5. Update the test script to include the new endpoints

## Data Relationships

The mock data is designed with realistic clinical relationships:

### Patient-Encounter Relationships
- **patient-1** (John Smith): 2 encounters - routine check-up and headache visit
- **patient-2** (Sarah Johnson): 1 encounter - routine check-up with lab work
- **patient-3** (Robert Williams): 1 encounter - fatigue evaluation with anemia diagnosis
- **patient-4** (Emily Davis): No encounters (baseline patient)
- **patient-5** (Michael Brown): 1 encounter - chest pain with hypertension diagnosis
- **patient-6** (Jennifer Wilson): 1 encounter - routine check-up

### Clinical Workflows
Each encounter includes appropriate clinical resources:
- **Vital signs** recorded during visits (blood pressure, heart rate, weight)
- **Conditions** diagnosed during encounters with appropriate severity levels
- **Medications** prescribed based on diagnosed conditions
- **Diagnostic reports** with laboratory and imaging results
- **Procedures** performed during encounters with documented outcomes

### Resource References
All resources maintain proper FHIR references:
- Observations reference both patient and encounter
- Conditions link to the diagnosing encounter
- Medications are prescribed during specific encounters
- Diagnostic reports include references to supporting observations
- Procedures document the encounter context

## Development

### Project Structure
```
mock-fhir-server/
├── server.js              # Main server file
├── package.json           # Dependencies and scripts
├── data/
│   └── mockData.js       # Sample FHIR data
├── utils/
│   ├── fhirUtils.js      # FHIR utility functions
│   └── searchUtils.js    # Search and pagination utilities
└── README.md             # This file
```

### Adding New Resources
To add support for new FHIR resource types:

1. Add sample data to `data/mockData.js`
2. Add endpoints to `server.js`
3. Update the capability statement
4. Add search parameters to `utils/searchUtils.js` if needed

### Extending Search Functionality
Search parameters can be extended in `utils/searchUtils.js`. The current implementation supports:
- String matching for names and text fields
- Token matching for coded values
- Date matching for temporal fields
- Reference matching for resource relationships

## Testing with Frontend Application

To use this mock server with the FHIR Resource Visualizer frontend:

1. Start the mock server: `npm start`
2. Configure your frontend application to use `http://localhost:3001/fhir/R4` as the FHIR base URL
3. The server will handle all FHIR API requests with realistic responses

## Troubleshooting

### Common Issues

**Port already in use**
- Change the port by setting the PORT environment variable: `PORT=3002 npm start`

**CORS errors**
- The server includes CORS middleware, but ensure your frontend is making requests to the correct URL

**Empty search results**
- Check that search parameters match the sample data
- Use the capability statement endpoint to see available search parameters

**Server won't start**
- Ensure Node.js is installed and dependencies are installed with `npm install`
- Check for syntax errors in the console output

## License

ISC License - see package.json for details.