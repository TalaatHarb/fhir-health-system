# FHIR Resource Visualizer

A comprehensive healthcare data visualization platform built with React and TypeScript, designed to interact with FHIR (Fast Healthcare Interoperability Resources) servers.

## Features

### 🔐 Authentication & Authorization
- Secure login system with fake authentication for development
- Protected routes with automatic redirection
- Session management and persistence

### 🏥 Organization Management
- Multi-organization support
- Organization selection and switching
- Organization-specific FHIR server configuration

### 👥 Patient Management
- Advanced patient search functionality
- Patient creation and management
- Multi-patient tab system for concurrent workflows

### 📋 Encounter & Resource Visualization
- Chronological encounter timeline
- Rich resource visualization for:
  - Observations with charts and trends
  - Conditions with severity indicators
  - Medication requests with dosage information
  - Diagnostic reports with structured display
  - Procedures with detailed outcomes

### ✨ Enhanced User Experience
- Real-time notifications and feedback
- Comprehensive error handling with retry mechanisms
- Offline detection and graceful degradation
- Loading states and progress indicators
- Responsive design for all screen sizes

### ♿ Accessibility Features
- WCAG 2.1 AA compliance
- Screen reader support with ARIA labels
- Keyboard navigation throughout the application
- High contrast mode support
- Reduced motion preferences
- Focus management and skip links

### 🚀 Performance Optimizations
- Lazy loading of components
- Code splitting for optimal bundle size
- Memoization of expensive computations
- Virtual scrolling for large datasets
- Debounced search inputs

## Technology Stack

- **Frontend**: React 19, TypeScript
- **Routing**: React Router DOM
- **Testing**: Vitest, React Testing Library
- **Build Tool**: Vite
- **Styling**: CSS3 with CSS Custom Properties
- **HTTP Client**: Fetch API with enhanced error handling

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd fhir-health-ui
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Development Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Lint code
npm run lint

# Preview production build
npm run preview
```

## Usage

### Authentication
1. Navigate to the application
2. Use the "Demo Login" button for development, or enter any credentials
3. The system uses fake authentication for development purposes

### Organization Selection
1. After login, select an organization from the available options
2. Switch organizations using the "Switch Org" button in the header
3. Each organization can have its own FHIR server configuration

### Patient Management
1. Use the search bar to find patients by name, ID, or other identifiers
2. Click on a patient to open them in a new tab
3. Manage multiple patients simultaneously using the tab system
4. Create new patients using the "New Patient" button

### Viewing Patient Data
1. Patient encounters are displayed in a chronological timeline
2. Click on encounters to view associated resources
3. Resources are displayed with clinical-friendly formatting
4. Use the expandable sections to view detailed information

### Creating New Data
1. Use the "New Encounter" button to create encounters
2. Add various resources (observations, conditions, etc.) to encounters
3. Forms include validation and FHIR compliance checking
4. Success/error feedback is provided for all operations

## Architecture

### Component Structure
```
src/
├── components/           # React components
│   ├── auth/            # Authentication components
│   ├── common/          # Shared/common components
│   ├── encounter/       # Encounter-related components
│   ├── organization/    # Organization management
│   ├── patient/         # Patient management
│   └── resource/        # Resource visualization
├── contexts/            # React contexts for state management
├── hooks/               # Custom React hooks
├── services/            # API services and FHIR client
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
└── __tests__/           # Test files
```

### State Management
The application uses React Context API for state management:
- **AuthContext**: User authentication and session management
- **OrganizationContext**: Organization selection and switching
- **PatientContext**: Multi-patient tab management
- **NotificationContext**: Toast notifications and user feedback

### FHIR Integration
- Modular FHIR client with support for multiple servers
- Resource-specific services for different FHIR resource types
- Error handling and retry mechanisms for network operations
- Offline queue for operations when disconnected

## Testing

The application includes comprehensive testing:

### Test Types
- **Unit Tests**: Individual component and function testing
- **Integration Tests**: Component interaction testing
- **End-to-End Tests**: Complete user workflow testing

### Test Coverage
- Authentication flows
- Organization management
- Patient search and management
- Encounter and resource visualization
- Error handling scenarios
- Accessibility features
- Performance optimizations

### Running Tests
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- PatientSearch.test.tsx

# Run tests in watch mode
npm run test:watch
```

## Accessibility

The application is built with accessibility as a first-class concern:

### Features
- **Keyboard Navigation**: Full keyboard support with logical tab order
- **Screen Reader Support**: Comprehensive ARIA labels and live regions
- **High Contrast**: Support for high contrast display modes
- **Reduced Motion**: Respects user's motion preferences
- **Focus Management**: Proper focus handling in modals and dynamic content
- **Color Contrast**: WCAG AA compliant color combinations

### Testing Accessibility
- Use screen readers (NVDA, JAWS, VoiceOver) to test functionality
- Navigate using only the keyboard
- Test with high contrast mode enabled
- Verify with accessibility testing tools

## Performance

### Optimizations Implemented
- **Code Splitting**: Lazy loading of route components
- **Bundle Optimization**: Tree shaking and dead code elimination
- **Memoization**: React.memo and useMemo for expensive operations
- **Debouncing**: Search inputs and API calls
- **Virtual Scrolling**: For large patient and encounter lists
- **Image Optimization**: Lazy loading and responsive images

### Performance Monitoring
- Use browser DevTools to monitor performance
- Check bundle size with `npm run build`
- Monitor memory usage during development
- Test on various devices and network conditions

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make your changes and add tests
4. Ensure all tests pass: `npm test`
5. Commit your changes: `git commit -m 'Add new feature'`
6. Push to the branch: `git push origin feature/new-feature`
7. Submit a pull request

### Development Guidelines
- Follow TypeScript best practices
- Write tests for new functionality
- Ensure accessibility compliance
- Follow the existing code style
- Update documentation as needed

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review existing issues and discussions

## Roadmap

### Upcoming Features
- Real FHIR server integration
- Advanced search filters
- Data export functionality
- Bulk operations
- Advanced charting and analytics
- Mobile app version

### Known Issues
- See the Issues section in the repository
- Performance optimization ongoing
- Additional FHIR resource types being added

---

Built with ❤️ for healthcare professionals and developers working with FHIR data.