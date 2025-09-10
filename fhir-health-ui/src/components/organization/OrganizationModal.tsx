import React from 'react';
import type { Organization } from '../../types';
import { Loading } from '../common/Loading';
import { useTranslation } from '../../hooks/useTranslation';
import { TestIds } from '../../types/testable';
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
  const { t } = useTranslation();
  
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
      data-testid={TestIds.MODAL_OVERLAY}
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="organization-modal-title"
    >
      <div className="organization-modal" data-testid={TestIds.ORG_MODAL}>
        <div className="organization-modal-header">
          <h2 id="organization-modal-title" data-testid={TestIds.ORG_MODAL_TITLE}>{t('organization.selectOrganization')}</h2>
          <button
            className="organization-modal-close"
            data-testid={TestIds.ORG_MODAL_CLOSE}
            onClick={onClose}
            aria-label={t('organization.closeSelection')}
            type="button"
          >
            ×
          </button>
        </div>

        <div className="organization-modal-content">
          {loading && (
            <div className="organization-modal-loading" data-testid={TestIds.ORG_LOADING}>
              <Loading size="medium" text={t('organization.loadingOrganizations')} />
            </div>
          )}

          {error && (
            <div className="organization-modal-error" data-testid={TestIds.ORG_ERROR}>
              <p>{t('organization.errorLoading')}: {error}</p>
              <button 
                className="organization-modal-retry"
                data-testid={TestIds.RETRY_BUTTON}
                onClick={() => window.location.reload()}
                type="button"
              >
                {t('common.retry')}
              </button>
            </div>
          )}

          {!loading && !error && organizations.length === 0 && (
            <div className="organization-modal-empty">
              <p>{t('organization.noOrganizationsAvailable')}</p>
            </div>
          )}

          {!loading && !error && organizations.length > 0 && (
            <div className="organization-modal-list">
              <p className="organization-modal-description">
                {t('organization.selectDescription')}
              </p>
              
              <div className="organization-list" data-testid={TestIds.ORG_LIST}>
                {organizations.map((org) => (
                  <div
                    key={org.id}
                    className={`organization-item ${currentOrg?.id === org.id ? 'selected' : ''}`}
                    data-testid={`${TestIds.ORG_ITEM}-${org.id}`}
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
                        {org.name || t('organization.unnamedOrganization')}
                      </h3>
                      
                      {org.id && (
                        <p className="organization-id">{t('organization.id')}: {org.id}</p>
                      )}
                      
                      {org.type && org.type.length > 0 && (
                        <p className="organization-type">
                          {t('organization.organizationType')}: {org.type.map(type => type.text || type.coding?.[0]?.display || t('patient.unknown')).join(', ')}
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
                      <div className="organization-selected-indicator" data-testid={TestIds.SELECTED_INDICATOR}>
                        ✓ {t('organization.selected')}
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
            {t('organization.changeNote')}
          </p>
        </div>
      </div>
    </div>
  );
}