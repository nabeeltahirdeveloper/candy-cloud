import React, { useEffect, useState } from 'react'
import CardWithMenu from '../../components/cards/CardWithMenu';
import { fetchDataRecentView } from '../../api/amt/workspace/recent';
import SectionTitle from '../../components/shared/SectionTitle';

const Recently = () => {
  const [recent, setRecent] = useState<any[]>([]);
  useEffect(() => {
    fetchDataRecentView(setRecent);
    
  }, []);
    const refreshRecentView = () => {
        fetchDataRecentView(setRecent); // Function to refresh recent files
      };
  return (
      <>
      <SectionTitle title="Recent view" />
    <div style={{width:'60rem'}} className="grid grid-cols-4 gap-6 max-xl:grid-cols-2 max-lg:grid-cols-1 ml-10 mt-10">

    {recent.map((item: { id: any; name: any; description: any; file_name: any; mime: any; file_size: any; user_id: any; parent_id: any; created_at: any; updated_at: any; deleted_at: any; path: any; disk_prefix: any; type: any; extension: any; public: any; thumbnail: any; workspace_id: any; owner_id: any; hash: any; url: any; users: any; tags: any; permissions: any }, index: any) => (
      <CardWithMenu
        key={index}
        item={{
          id: item.id,
          name: item.name,
          description: item.description,
          file_name: item.file_name,
          mime: item.mime,
          file_size: item.file_size,
          user_id: item.user_id,
          parent_id: item.parent_id,
          created_at: item.created_at,
          updated_at: item.updated_at,
          deleted_at: item.deleted_at,
          path: item.path,
          disk_prefix: item.disk_prefix,
          type: item.type,
          extension: item.extension,
          public: item.public,
          thumbnail: item.thumbnail,
          workspace_id: item.workspace_id,
          owner_id: item.owner_id,
          hash: item.hash,
          url: item.url,
          users: item.users,
          tags: item.tags,
          permissions: item.permissions,
        }}
        refreshRecent={refreshRecentView}
      />
    ))}
  </div>
   </>
  )
}

export default Recently