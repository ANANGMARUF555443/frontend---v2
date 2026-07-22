import { Link } from 'react-router-dom'
import LibraryPicker from '../../file-manager/components/LibraryPicker'
import '../../../shared/styles/Auth.css'
import './KosakataAdmin.css'

import { useKosakataAdmin } from './useKosakataAdmin'
import { PICKER_CATEGORY } from './constants'
import BabNav from './components/BabNav'
import HafalanInfo from './components/HafalanInfo'
import LetakTabs from './components/LetakTabs'
import Toolbar from './components/Toolbar'
import KosakataList from './components/KosakataList'
import KosakataFormModal from './components/KosakataFormModal'
import SqlImportModal from './components/SqlImportModal'
import TrashModal from './components/TrashModal'

export default function KosakataAdmin() {
  const ka = useKosakataAdmin()

  return (
    <div className="ka-page">
      <Link className="back-link" to="/dashboard">&larr; Kembali ke Dashboard</Link>

      <div className="ka-header">
        <span className="ka-header-icon" aria-hidden="true">冊</span>
        <div>
          <h1>{ka.canManage ? 'Kosakata Admin' : 'Kosakata'}</h1>
          <p>{ka.canManage ? 'Kelola kosakata per bab & bagian' : 'Daftar kosakata per bab & bagian'}</p>
        </div>
      </div>

      <BabNav bab={ka.bab} setBab={ka.setBab} />

      <HafalanInfo
        hafalanLoading={ka.hafalanLoading}
        hafalanStats={ka.hafalanStats}
        babHafalan={ka.babHafalan}
        bab={ka.bab}
      />

      <LetakTabs
        letak={ka.letak}
        grouped={ka.grouped}
        hiddenIds={ka.hiddenIds}
        markedIds={ka.markedIds}
        changeLetak={ka.changeLetak}
        activeLetak={ka.activeLetak}
      />

      <Toolbar
        search={ka.search}
        setSearch={ka.setSearch}
        viewMenuOpen={ka.viewMenuOpen}
        toggleViewMenu={ka.toggleViewMenu}
        viewMode={ka.viewMode}
        chooseViewMode={ka.chooseViewMode}
        setViewMenuOpen={ka.setViewMenuOpen}
        openTrash={ka.openTrash}
        hiddenCount={ka.hiddenCount}
        canManage={ka.canManage}
        openSqlImport={ka.openSqlImport}
        openAddForm={ka.openAddForm}
      />

      {ka.error && <p className="auth-error">{ka.error}</p>}

      <KosakataList
        loading={ka.loading}
        filteredItems={ka.filteredItems}
        search={ka.search}
        currentItems={ka.currentItems}
        activeLetak={ka.activeLetak}
        bab={ka.bab}
        cardOverride={ka.cardOverride}
        viewMode={ka.viewMode}
        numberById={ka.numberById}
        markedIds={ka.markedIds}
        markingId={ka.markingId}
        hidingId={ka.hidingId}
        canManage={ka.canManage}
        deletingId={ka.deletingId}
        toggleCardOverride={ka.toggleCardOverride}
        toggleMark={ka.toggleMark}
        toggleHide={ka.toggleHide}
        openEditForm={ka.openEditForm}
        handleDelete={ka.handleDelete}
      />

      <KosakataFormModal
        formOpen={ka.formOpen}
        formMode={ka.formMode}
        formData={ka.formData}
        formError={ka.formError}
        saving={ka.saving}
        closeForm={ka.closeForm}
        handleFormSubmit={ka.handleFormSubmit}
        handleFormField={ka.handleFormField}
        openPicker={ka.openPicker}
      />

      {/* ── Modal picker "pilih dari Library" ──────────────────────── */}
      {ka.pickerField && (
        <LibraryPicker
          category={PICKER_CATEGORY[ka.pickerField]}
          token={ka.token}
          onSelect={ka.selectPickerItem}
          onClose={ka.closePicker}
        />
      )}

      <SqlImportModal
        sqlOpen={ka.sqlOpen}
        closeSqlImport={ka.closeSqlImport}
        handleSqlImportSubmit={ka.handleSqlImportSubmit}
        sqlText={ka.sqlText}
        setSqlText={ka.setSqlText}
        sqlSaving={ka.sqlSaving}
        sqlError={ka.sqlError}
        sqlResultCount={ka.sqlResultCount}
        bab={ka.bab}
        activeLetak={ka.activeLetak}
      />

      <TrashModal
        trashOpen={ka.trashOpen}
        closeTrash={ka.closeTrash}
        activeLetak={ka.activeLetak}
        bab={ka.bab}
        hiddenInCurrentLetak={ka.hiddenInCurrentLetak}
        hidingId={ka.hidingId}
        toggleHide={ka.toggleHide}
      />
    </div>
  )
}
