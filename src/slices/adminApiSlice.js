import { apiSlice } from './apiSlice'

export const adminApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query({
      query: () => '/admin/users',
      providesTags: ['Users'],
    }),

    createUser: builder.mutation({
      query: (data) => ({ url: '/admin/users', method: 'POST', body: data }),
      invalidatesTags: ['Users'],
    }),

    updateUser: builder.mutation({
      query: ({ userId, ...data }) => ({
        url: `/admin/users/${userId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Users'],
    }),

    getOffices: builder.query({
      query: () => '/admin/offices',
      providesTags: ['Offices'],
    }),

    updateOffice: builder.mutation({
      query: ({ officeId, ...data }) => ({
        url: `/admin/offices/${officeId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Offices'],
    }),

    getAuditLogs: builder.query({
      query: (params = {}) => {
        const qs = new URLSearchParams()
        Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, v) })
        return `/admin/audit-logs?${qs}`
      },
    }),
  }),
})

export const {
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useGetOfficesQuery,
  useUpdateOfficeMutation,
  useGetAuditLogsQuery,
} = adminApiSlice