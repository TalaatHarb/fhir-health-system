import type { Patient, HumanName, Address, ContactPoint, Identifier, CodeableConcept, Reference } from '../../types/fhir';

/**
 * Factory for creating realistic Patient test data with various scenarios
 * Supports patients with encounters, conditions, and clinical data relationships
 */
export class PatientFactory {
  private static idCounter = 1000;

  /**
   * Generate a unique patient ID
   */
  private static generateId(): string {
    return `patient-${this.idCounter++}`;
  }

  /**
   * Create a basic patient with minimal required fields
   */
  static createBasicPatient(overrides: Partial<Patient> = {}): Patient {
    const id = overrides.id || this.generateId();
    
    return {
      resourceType: 'Patient',
      id,
      active: true,
      name: [{
        use: 'official',
        family: 'Doe',
        given: ['John'],
        text: 'John Doe'
      }],
      gender: 'male',
      birthDate: '1980-01-15',
      telecom: [{
        system: 'phone',
        value: '+1-555-0123',
        use: 'home'
      }, {
        system: 'email',
        value: 'john.doe@example.com',
        use: 'home'
      }],
      address: [{
        use: 'home',
        type: 'both',
        line: ['123 Main St'],
        city: 'Anytown',
        state: 'CA',
        postalCode: '12345',
        country: 'US'
      }],
      identifier: [{
        use: 'usual',
        type: {
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/v2-0203',
            code: 'MR',
            display: 'Medical Record Number'
          }]
        },
        system: 'http://hospital.example.org',
        value: `MRN-${id.split('-')[1]}`
      }],
      managingOrganization: {
        reference: 'Organization/org-123',
        display: 'Test Healthcare Organization'
      },
      ...overrides
    };
  }

  /**
   * Create a patient with comprehensive demographic information
   */
  static createDetailedPatient(overrides: Partial<Patient> = {}): Patient {
    const basePatient = this.createBasicPatient(overrides);
    
    return {
      ...basePatient,
      name: [{
        use: 'official',
        family: 'Johnson',
        given: ['Sarah', 'Marie'],
        prefix: ['Ms.'],
        text: 'Ms. Sarah Marie Johnson'
      }, {
        use: 'maiden',
        family: 'Smith',
        given: ['Sarah'],
        text: 'Sarah Smith'
      }],
      gender: 'female',
      birthDate: '1985-03-22',
      maritalStatus: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/v3-MaritalStatus',
          code: 'M',
          display: 'Married'
        }]
      },
      telecom: [{
        system: 'phone',
        value: '+1-555-0456',
        use: 'mobile',
        rank: 1
      }, {
        system: 'phone',
        value: '+1-555-0789',
        use: 'work',
        rank: 2
      }, {
        system: 'email',
        value: 'sarah.johnson@example.com',
        use: 'home'
      }],
      address: [{
        use: 'home',
        type: 'both',
        line: ['456 Oak Avenue', 'Apt 2B'],
        city: 'Springfield',
        state: 'IL',
        postalCode: '62701',
        country: 'US',
        period: {
          start: '2020-01-01'
        }
      }, {
        use: 'work',
        type: 'physical',
        line: ['789 Business Blvd'],
        city: 'Springfield',
        state: 'IL',
        postalCode: '62702',
        country: 'US'
      }],
      contact: [{
        relationship: [{
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/v2-0131',
            code: 'C',
            display: 'Emergency Contact'
          }]
        }],
        name: {
          family: 'Johnson',
          given: ['Michael'],
          text: 'Michael Johnson'
        },
        telecom: [{
          system: 'phone',
          value: '+1-555-0321',
          use: 'mobile'
        }],
        gender: 'male'
      }],
      communication: [{
        language: {
          coding: [{
            system: 'urn:ietf:bcp:47',
            code: 'en-US',
            display: 'English (United States)'
          }]
        },
        preferred: true
      }],
      ...overrides
    };
  }

  /**
   * Create a pediatric patient
   */
  static createPediatricPatient(overrides: Partial<Patient> = {}): Patient {
    const today = new Date();
    const birthDate = new Date(today.getFullYear() - 8, 5, 10); // 8 years old
    
    return this.createBasicPatient({
      name: [{
        use: 'official',
        family: 'Wilson',
        given: ['Emma', 'Grace'],
        text: 'Emma Grace Wilson'
      }],
      gender: 'female',
      birthDate: birthDate.toISOString().split('T')[0],
      contact: [{
        relationship: [{
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/v3-RoleCode',
            code: 'MTH',
            display: 'Mother'
          }]
        }],
        name: {
          family: 'Wilson',
          given: ['Jennifer'],
          text: 'Jennifer Wilson'
        },
        telecom: [{
          system: 'phone',
          value: '+1-555-0654',
          use: 'mobile'
        }],
        address: {
          use: 'home',
          line: ['321 Elm Street'],
          city: 'Hometown',
          state: 'TX',
          postalCode: '75001',
          country: 'US'
        }
      }],
      ...overrides
    });
  }

  /**
   * Create an elderly patient
   */
  static createElderlyPatient(overrides: Partial<Patient> = {}): Patient {
    const today = new Date();
    const birthDate = new Date(today.getFullYear() - 78, 2, 15); // 78 years old
    
    return this.createBasicPatient({
      name: [{
        use: 'official',
        family: 'Anderson',
        given: ['Robert', 'James'],
        prefix: ['Mr.'],
        text: 'Mr. Robert James Anderson'
      }],
      gender: 'male',
      birthDate: birthDate.toISOString().split('T')[0],
      maritalStatus: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/v3-MaritalStatus',
          code: 'W',
          display: 'Widowed'
        }]
      },
      contact: [{
        relationship: [{
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/v3-RoleCode',
            code: 'CHILD',
            display: 'Child'
          }]
        }],
        name: {
          family: 'Anderson',
          given: ['Lisa'],
          text: 'Lisa Anderson'
        },
        telecom: [{
          system: 'phone',
          value: '+1-555-0987',
          use: 'mobile'
        }]
      }],
      ...overrides
    });
  }

  /**
   * Create a patient with multiple identifiers (insurance, SSN, etc.)
   */
  static createPatientWithIdentifiers(overrides: Partial<Patient> = {}): Patient {
    const basePatient = this.createBasicPatient(overrides);
    
    return {
      ...basePatient,
      identifier: [
        ...(basePatient.identifier || []),
        {
          use: 'usual',
          type: {
            coding: [{
              system: 'http://terminology.hl7.org/CodeSystem/v2-0203',
              code: 'SS',
              display: 'Social Security Number'
            }]
          },
          system: 'http://hl7.org/fhir/sid/us-ssn',
          value: '123-45-6789'
        },
        {
          use: 'secondary',
          type: {
            coding: [{
              system: 'http://terminology.hl7.org/CodeSystem/v2-0203',
              code: 'MB',
              display: 'Member Number'
            }]
          },
          system: 'http://insurance.example.org',
          value: 'INS-987654321'
        }
      ]
    };
  }

  /**
   * Create multiple patients representing a family unit
   */
  static createPatientFamily(memberCount: number = 4): Patient[] {
    const family: Patient[] = [];
    const familyName = 'Thompson';
    const address: Address = {
      use: 'home',
      type: 'both',
      line: ['789 Family Lane'],
      city: 'Familyville',
      state: 'OH',
      postalCode: '44101',
      country: 'US'
    };

    // Father
    family.push(this.createBasicPatient({
      name: [{
        use: 'official',
        family: familyName,
        given: ['David', 'Michael'],
        text: `David Michael ${familyName}`
      }],
      gender: 'male',
      birthDate: '1975-08-12',
      address: [address],
      maritalStatus: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/v3-MaritalStatus',
          code: 'M',
          display: 'Married'
        }]
      }
    }));

    // Mother
    if (memberCount > 1) {
      family.push(this.createBasicPatient({
        name: [{
          use: 'official',
          family: familyName,
          given: ['Lisa', 'Ann'],
          text: `Lisa Ann ${familyName}`
        }],
        gender: 'female',
        birthDate: '1977-11-25',
        address: [address],
        maritalStatus: {
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/v3-MaritalStatus',
            code: 'M',
            display: 'Married'
          }]
        }
      }));
    }

    // Children
    const childrenNames = [
      { given: ['Alex', 'James'], gender: 'male', birthDate: '2005-04-18' },
      { given: ['Sophie', 'Marie'], gender: 'female', birthDate: '2008-09-03' },
      { given: ['Ryan', 'David'], gender: 'male', birthDate: '2012-01-22' }
    ];

    for (let i = 2; i < memberCount && i - 2 < childrenNames.length; i++) {
      const child = childrenNames[i - 2];
      family.push(this.createBasicPatient({
        name: [{
          use: 'official',
          family: familyName,
          given: child.given,
          text: `${child.given.join(' ')} ${familyName}`
        }],
        gender: child.gender as 'male' | 'female',
        birthDate: child.birthDate,
        address: [address],
        contact: [{
          relationship: [{
            coding: [{
              system: 'http://terminology.hl7.org/CodeSystem/v3-RoleCode',
              code: 'PRN',
              display: 'Parent'
            }]
          }],
          name: {
            family: familyName,
            given: ['David'],
            text: `David ${familyName}`
          },
          telecom: [{
            system: 'phone',
            value: '+1-555-0111',
            use: 'mobile'
          }]
        }]
      }));
    }

    return family;
  }

  /**
   * Create a patient with specific conditions for testing clinical scenarios
   */
  static createPatientWithConditions(conditions: string[], overrides: Partial<Patient> = {}): Patient {
    const patient = this.createDetailedPatient(overrides);
    
    // Add condition-specific metadata to patient for reference
    patient.meta = {
      ...patient.meta,
      tag: conditions.map(condition => ({
        system: 'http://example.org/test-conditions',
        code: condition.toLowerCase().replace(/\s+/g, '-'),
        display: condition
      }))
    };

    return patient;
  }

  /**
   * Create a patient with encounter history for testing timeline scenarios
   */
  static createPatientWithEncounters(encounterCount: number, overrides: Partial<Patient> = {}): Patient {
    const patient = this.createDetailedPatient(overrides);
    
    // Add encounter metadata for reference
    patient.meta = {
      ...patient.meta,
      tag: [{
        system: 'http://example.org/test-encounters',
        code: 'has-encounters',
        display: `Patient with ${encounterCount} encounters`
      }]
    };

    return patient;
  }

  /**
   * Create a patient for testing specific demographics
   */
  static createPatientWithDemographics(demographics: {
    age?: number;
    gender?: 'male' | 'female' | 'other' | 'unknown';
    maritalStatus?: string;
    language?: string;
  }, overrides: Partial<Patient> = {}): Patient {
    const today = new Date();
    const birthDate = demographics.age 
      ? new Date(today.getFullYear() - demographics.age, 0, 1)
      : new Date('1980-01-01');

    return this.createBasicPatient({
      gender: demographics.gender || 'unknown',
      birthDate: birthDate.toISOString().split('T')[0],
      maritalStatus: demographics.maritalStatus ? {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/v3-MaritalStatus',
          code: demographics.maritalStatus,
          display: demographics.maritalStatus
        }]
      } : undefined,
      communication: demographics.language ? [{
        language: {
          coding: [{
            system: 'urn:ietf:bcp:47',
            code: demographics.language,
            display: demographics.language
          }]
        },
        preferred: true
      }] : undefined,
      ...overrides
    });
  }

  /**
   * Create a batch of patients for testing search and pagination
   */
  static createPatientBatch(count: number, namePrefix: string = 'Test'): Patient[] {
    const patients: Patient[] = [];
    
    for (let i = 0; i < count; i++) {
      patients.push(this.createBasicPatient({
        name: [{
          use: 'official',
          family: `${namePrefix}${i + 1}`,
          given: ['Patient'],
          text: `Patient ${namePrefix}${i + 1}`
        }],
        birthDate: new Date(1950 + (i % 50), (i % 12), (i % 28) + 1).toISOString().split('T')[0]
      }));
    }
    
    return patients;
  }
}