import React from 'react';
import type { Organization } from '../../types';
import { Loading } from '../common/Loading';
import './OrganizationModal.css';

interface OrganizationModalProps {
  isOpen: boolean;
  organizations: Organization[];
  currentOrg: Organization | null;
  onSelect: (org: Organization) => void;
  onClose: () => void;
  loading?: boolean;
  error?: string | null;
}

export function OrganizationModal({
  isOpen,
  organizations,
  currentOrg,
  onSelect,
  onClose,
  loading = false,
  error = null
}: OrganizationModalProps) {
  if (!isOpen) {
    return null;
  }

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleOrganizationSelect = (org: Organization) => {
    onSelect(org);
  };

  return (
    <div 
      className="organization-modal-overlay" 
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="organization-modal-title"
    >
      <div className="organization-modal">
        <div className="organization-modal-header">
          <h2 id="organization-modal-title">Select Organization</h2>
          <button
            className="organization-modal-close"
            onClick={onClose}
            aria-label="Close organization selection"
            type="button"
          >
            ×
          </button>
        </div>

        <div className="organization-modal-content">
          {loading && (
            <div className="organization-modal-loading">
              <Loading size="medium" text="Loading organizations..." />
            </div>
          )}

          {error && (
            <div className="organization-modal-error">
              <p>Error loading organizations: {error}</p>
              <button 
                className="organization-modal-retry"
                onClick={() => window.location.reload()}
                type="button"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && organizations.length === 0 && (
            <div className="organization-modal-empty">
              <p>No organizations available.</p>
            </div>
          )}

          {!loading && !error && organizations.length > 0 && (
            <div className="organization-modal-list">
              <p className="organization-modal-description">
                Please select an organization to continue. This will determine which patients and resources you can access.
              </p>
              
              <div className="organization-list">
                {organizations.map((org) => (
                  <div
                    key={org.id}
                    className={`organization-item ${currentOrg?.id === org.id ? 'selected' : ''}`}
                    onClick={() => handleOrganizationSelect(org)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleOrganizationSelect(org);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-pressed={currentOrg?.id === org.id}
                  >
                    <div className="organization-item-content">
                      <h3 className="organization-name">
                        {org.name || 'Unnamed Organization'}
                      </h3>
                      
                      {org.id && (
                        <p className="organization-id">ID: {org.id}</p>
                      )}
                      
                      {org.type && org.type.length > 0 && (
                        <p className="organization-type">
                          Type: {org.type.map(t => t.text || t.coding?.[0]?.display || 'Unknown').join(', ')}
                        </p>
                      )}
                      
                      {org.address && org.address.length > 0 && (
                        <p className="organization-address">
                          {org.address[0].line?.join(', ')}{org.address[0].line && ', '}
                          {org.address[0].city}{org.address[0].city && ', '}
                          {org.address[0].state} {org.address[0].postalCode}
                        </p>
                      )}
                      
                      {org.telecom && org.telecom.length > 0 && (
                        <div className="organization-contact">
                          {org.telecom
                            .filter(contact => contact.system === 'phone' || contact.system === 'email')
                            .slice(0, 2)
                            .map((contact, index) => (
                              <span key={index} className="organization-contact-item">
                                {contact.system === 'phone' ? '📞' : '📧'} {contact.value}
                              </span>
                            ))
                          }
                        </div>
                      )}
                    </div>
                    
                    {currentOrg?.id === org.id && (
                      <div className="organization-selected-indicator">
                        ✓ Selected
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="organization-modal-footer">
          <p className="organization-modal-note">
            You can change your organization selection at any time from the main interface.
          </p>
        </div>
      </div>
    </div>
  );
}