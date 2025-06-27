'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { db } from '@/lib/firebase/config';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/Table';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { toast } from '@/components/ui/use-toast';

interface Reservation {
  id: string;
  customerName: string;
  partySize: number;
  date: Date;
  time: string;
  status: 'completed' | 'cancelled' | 'no-show';
  tableNumber?: string;
  source: string;
}

export default function ReservationHistoryPage() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [startDate, setStartDate] = useState(new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user]);

  const fetchHistory = async () => {
    if (!user?.restaurantId) return;

    try {
      setLoading(true);
      const start = Timestamp.fromDate(new Date(startDate));
      const end = Timestamp.fromDate(new Date(endDate));

      const q = query(
        collection(db, 'restaurants', user.restaurantId, 'reservations'),
        where('date', '>=', start),
        where('date', '<=', end),
        orderBy('date', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const historyData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.date.toDate()
        } as Reservation;
      });

      setReservations(historyData);
    } catch (error) {
      console.error('Error fetching reservation history:', error);
      toast({ title: 'Error', description: 'Failed to load history', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    setCurrentPage(1);
    fetchHistory();
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'cancelled': return 'destructive';
      case 'no-show': return 'secondary';
      default: return 'outline';
    }
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Customer Name', 'Party Size', 'Date', 'Time', 'Status', 'Table', 'Source'];
    const rows = filteredReservations.map(res => 
      [res.id, res.customerName, res.partySize, res.date.toLocaleDateString(), res.time, res.status, res.tableNumber || 'N/A', res.source].join(',')
    );
    
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `reservation-history-${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredReservations = useMemo(() => {
    return reservations
      .filter(res => statusFilter === 'all' || res.status === statusFilter)
      .filter(res => 
        res.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (res.tableNumber && res.tableNumber.includes(searchTerm))
      );
  }, [reservations, statusFilter, searchTerm]);

  const paginatedReservations = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredReservations.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredReservations, currentPage, rowsPerPage]);

  const stats = useMemo(() => ({
    total: filteredReservations.length,
    completed: filteredReservations.filter(r => r.status === 'completed').length,
    cancelled: filteredReservations.filter(r => r.status === 'cancelled').length,
    noShow: filteredReservations.filter(r => r.status === 'no-show').length
  }), [filteredReservations]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-foreground">Reservation History</h1>
        <Button onClick={() => window.location.href = '/dashboard/reservations'}>Back to Reservations</Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="p-2 rounded-md border border-border bg-card text-card-foreground">
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no-show">No Show</option>
          </select>
          <Input placeholder="Search by name or table..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          <Button onClick={handleFilter}>Filter</Button>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4"><div className="text-2xl font-bold">{stats.total}</div><div className="text-sm text-muted-foreground">Total</div></Card>
        <Card className="p-4"><div className="text-2xl font-bold text-green-600">{stats.completed}</div><div className="text-sm text-muted-foreground">Completed</div></Card>
        <Card className="p-4"><div className="text-2xl font-bold text-red-600">{stats.cancelled}</div><div className="text-sm text-muted-foreground">Cancelled</div></Card>
        <Card className="p-4"><div className="text-2xl font-bold text-yellow-600">{stats.noShow}</div><div className="text-sm text-muted-foreground">No-Shows</div></Card>
      </div>

      {/* History Table */}
      <Card>
        <div className="flex justify-end p-4">
          <Button variant="outline" onClick={exportToCSV}>Export to CSV</Button>
        </div>
        {loading ? <LoadingSpinner /> : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Party Size</TableHead>
                <TableHead>Table</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedReservations.map(res => (
                <TableRow key={res.id}>
                  <TableCell>{res.customerName}</TableCell>
                  <TableCell>{res.date.toLocaleDateString()}</TableCell>
                  <TableCell>{res.time}</TableCell>
                  <TableCell>{res.partySize}</TableCell>
                  <TableCell>{res.tableNumber || 'N/A'}</TableCell>
                  <TableCell><Badge variant={getStatusBadgeVariant(res.status)}>{res.status}</Badge></TableCell>
                  <TableCell>{res.source}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {/* Pagination */}
        <div className="flex justify-between items-center p-4">
          <span className="text-sm text-muted-foreground">Page {currentPage} of {Math.ceil(filteredReservations.length / rowsPerPage)}</span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Previous</Button>
            <Button variant="outline" onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredReservations.length / rowsPerPage), p + 1))} disabled={currentPage * rowsPerPage >= filteredReservations.length}>Next</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
